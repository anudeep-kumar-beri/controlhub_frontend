// financeStore.js — thin layer over IndexedDB adapter
import { getAll, get, put, del } from '../indexedDBAdapter';
import { todayISO } from '../../utils/format';
import { calculateFD } from '../../utils/finance/financeCalc';
import { calculatePaymentBreakdown, calculateAccruedInterest } from '../../utils/finance/loanCalculations';

export async function seedIfEmpty() {
  // Seed a couple of sample entries for demo; skip if data exists
  const [investments, income, expenses] = await Promise.all([
    getAll('investments'),
    getAll('income'),
    getAll('expenses'),
  ]);

  if ((investments?.length || 0) === 0) {
    await put('investments', { id: 'inv-1', type: 'FD', institution: 'Demo Bank', amount: 100000, interest_rate: 6.5, tenure_months: 12, start_date: new Date().toISOString() });
  }
  if ((income?.length || 0) === 0) {
    await put('income', { id: 'inc-1', label: 'Salary', inflow: 50000, date: new Date().toISOString() });
  }
  if ((expenses?.length || 0) === 0) {
    await put('expenses', { id: 'exp-1', label: 'Rent', outflow: 15000, date: new Date().toISOString() });
  }
}

export async function listInvestments() { return getAll('investments'); }
export async function listIncome() { return getAll('income'); }
export async function listExpenses() { return getAll('expenses'); }
export async function listLoans() { return getAll('loans'); }
export async function listLoanPayments() { return getAll('loan_payments'); }
export async function listAccounts() { return getAll('accounts'); }

// Generic save helpers
async function auditLog({ action, store, before, after }) {
  const entry = { id: `audit-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, action, store, item_id: after?.id || before?.id, before, after, timestamp: new Date().toISOString() };
  await put('audit', entry);
}

export async function saveRecord(store, record) {
  const now = new Date().toISOString();
  const isNew = !record.id;
  const before = record.id ? await get(store, record.id) : null;
  if (!record.id) {
    record.id = `${store}-${Date.now()}`;
    record.createdAt = now;
  }
  record.updatedAt = now;
  // Normalize date to YYYY-MM-DD if present; also map legacy fields
  if (record.start_date && !record.date) {
    record.date = String(record.start_date).slice(0,10);
  }
  if (record.date) {
    record.date = String(record.date).slice(0,10);
  } else {
    record.date = todayISO();
  }
  await put(store, record);
  await auditLog({ action: isNew ? 'create' : 'update', store, before, after: record });
  return record;
}

export async function saveInvestment(inv) { return saveRecord('investments', inv); }
export async function saveIncome(rec) { return saveRecord('income', rec); }
export async function saveExpense(rec) { return saveRecord('expenses', rec); }
export async function saveLoan(rec) { return saveRecord('loans', rec); }
export async function saveAccount(acc) { return saveRecord('accounts', acc); }

export async function deleteInvestment(id){ return del('investments', id); }
export async function deleteIncome(id){ return del('income', id); }
export async function deleteExpense(id){ return del('expenses', id); }
export async function deleteLoan(id){ return del('loans', id); }
export async function deleteAccount(id){ return del('accounts', id); }

export async function saveLoanPayment(payment) { return saveRecord('loan_payments', payment); }
export async function deleteLoanPayment(id) { return del('loan_payments', id); }

// Patch helper: merge partial changes into existing record safely
export async function patchRecord(store, id, patch) {
  const existing = await get(store, id);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  return saveRecord(store, updated);
}

export async function deleteWithAudit(store, id) {
  const before = await get(store, id);
  await del(store, id);
  await auditLog({ action: 'delete', store, before, after: null });
}

// Reorder helper: swap display_order between two items
export async function moveItemUp(store, item, allItems) {
  // Ensure all items have display_order
  const sorted = allItems.slice().sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  const currentIndex = sorted.findIndex(i => i.id === item.id);
  if (currentIndex <= 0) return; // Already at top
  
  const prevItem = sorted[currentIndex - 1];
  const temp = item.display_order || currentIndex;
  await patchRecord(store, item.id, { display_order: prevItem.display_order || (currentIndex - 1) });
  await patchRecord(store, prevItem.id, { display_order: temp });
}

export async function moveItemDown(store, item, allItems) {
  const sorted = allItems.slice().sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  const currentIndex = sorted.findIndex(i => i.id === item.id);
  if (currentIndex < 0 || currentIndex >= sorted.length - 1) return; // Already at bottom
  
  const nextItem = sorted[currentIndex + 1];
  const temp = item.display_order || currentIndex;
  await patchRecord(store, item.id, { display_order: nextItem.display_order || (currentIndex + 1) });
  await patchRecord(store, nextItem.id, { display_order: temp });
}

// Initialize display_order for items that don't have it
export async function ensureDisplayOrder(store) {
  const items = await getAll(store);
  let needsUpdate = false;
  items.forEach((item, idx) => {
    if (item.display_order === undefined || item.display_order === null) {
      item.display_order = idx;
      needsUpdate = true;
    }
  });
  if (needsUpdate) {
    await Promise.all(items.map(item => put(store, item)));
  }
}

// List audit entries since a given ISO timestamp (inclusive)
export async function listAuditsSince(sinceIso = '') {
  const all = await getAll('audit');
  if (!sinceIso) return all || [];
  const since = new Date(sinceIso);
  if (isNaN(since)) return all || [];
  return (all || []).filter(a => {
    const t = new Date(a.timestamp || a.createdAt || 0);
    return !isNaN(t) && t >= since;
  });
}

function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const dd = new Date(d.getTime());
  dd.setMonth(dd.getMonth() + (Number(months)||0));
  return dd.toISOString().slice(0,10);
}

function inDateRange(dateStr, fromDate, toDate) {
  if (!fromDate && !toDate) return true;
  const d = String(dateStr||'');
  if (fromDate && d < fromDate) return false;
  if (toDate && d > toDate) return false;
  return true;
}

export async function getMasterTransactions({ fromDate = null, toDate = null, accountId = null } = {}) {
  const [investments, income, expenses, loans, payments, accounts] = await Promise.all([
    getAll('investments'), getAll('income'), getAll('expenses'), getAll('loans'), getAll('loan_payments'), getAll('accounts')
  ]);

  // Build account lookup map
  const accountMap = new Map();
  for (const acc of accounts || []) {
    accountMap.set(acc.id, acc);
  }

  const tx = [];

  // Income -> inflow on date
  for (const r of income || []) {
    if (accountId && r.account_id !== accountId) continue;
    const dt = r.date?.slice(0,10) || todayISO();
    if (!inDateRange(dt, fromDate, toDate)) continue;
    const account = r.account_id ? accountMap.get(r.account_id) : null;
    tx.push({
      id: `tx-inc-${r.id}`,
      date: dt,
      category: `Income — ${r.category || r.source || 'General'}`,
      inflow: Number(r.amount ?? r.inflow ?? 0) || 0,
      outflow: 0,
      notes: r.notes || '',
      ts: r.createdAt || `${dt}T00:00:00.000Z`,
      source: { store: 'income', id: r.id },
      account_id: r.account_id,
      account_name: account?.name || 'Unassigned'
    });
  }

  // Expenses -> outflow on date
  for (const r of expenses || []) {
    if (accountId && r.account_id !== accountId) continue;
    const dt = r.date?.slice(0,10) || todayISO();
    if (!inDateRange(dt, fromDate, toDate)) continue;
    const account = r.account_id ? accountMap.get(r.account_id) : null;
    tx.push({
      id: `tx-exp-${r.id}`,
      date: dt,
      category: `Expense — ${r.category || r.title || 'General'}`,
      inflow: 0,
      outflow: Number(r.amount ?? r.outflow ?? 0) || 0,
      notes: r.notes || '',
      ts: r.createdAt || `${dt}T00:00:00.000Z`,
      source: { store: 'expenses', id: r.id },
      account_id: r.account_id,
      account_name: account?.name || 'Unassigned'
    });
  }

  // Investments -> outflow on creation; inflow on maturity (FD) or cashout (General)
  for (const r of investments || []) {
    // Filter: for investment, outflow uses account_id; inflows may use payout_account_id
    const start = (r.start_date || r.date || todayISO()).slice(0,10);
    const tenure = Number(r.tenure_months || r.tenure || 0);
    const maturity = (r.maturity_date && String(r.maturity_date).slice(0,10)) || addMonths(start, tenure);
    const amount = Number(r.amount ?? r.inflow ?? 0) || 0;
    const rate = Number(r.rate ?? r.interest_rate ?? 0) || 0;
    const { maturity_value } = calculateFD({ amount, interest_rate: rate, tenure_months: tenure });
    const debitAcc = r.account_id ? accountMap.get(r.account_id) : null;
    const creditAccountId = r.payout_account_id || r.account_id;
    const creditAcc = creditAccountId ? accountMap.get(creditAccountId) : null;
    // Outflow (debit) filter by accountId when provided
    if ((!accountId || r.account_id === accountId) && inDateRange(start, fromDate, toDate)) {
      tx.push({ id: `tx-inv-out-${r.id}`, date: start, category: `Investment — ${r.type || 'Asset'}` , inflow: 0, outflow: amount, notes: r.notes || '', ts: r.createdAt || `${start}T00:00:00.000Z`, source: { store: 'investments', id: r.id }, account_id: r.account_id, account_name: debitAcc?.name || 'Unassigned' });
    }
    // FD: auto maturity inflow + interest payouts based on payout method; General: inflow only when cashout provided
    const invType = (r.type || '').toUpperCase();
    if (invType === 'FD') {
      const today = todayISO();
      const payoutMethod = r.interest_payout_method || r.payout_method || 'at_maturity';
      
      // Generate interest income transactions based on payout method
      if (rate > 0 && tenure > 0 && payoutMethod !== 'at_maturity') {
        const { periodic_payout } = calculateFD({ 
          amount, 
          interest_rate: rate, 
          tenure_months: tenure,
          interest_payout_method: payoutMethod 
        });
        
        // Determine payout frequency
        let payoutFrequency = 1; // months
        if (payoutMethod === 'quarterly') payoutFrequency = 3;
        else if (payoutMethod === 'annual') payoutFrequency = 12;
        
        // Generate income entries for each payout period
        const totalPayouts = Math.floor(tenure / payoutFrequency);
        for (let period = 1; period <= totalPayouts; period++) {
          const payoutDate = addMonths(start, period * payoutFrequency);
          
          // Only add interest entries for dates that have already occurred
          if (payoutDate <= today && (!accountId || creditAccountId === accountId) && inDateRange(payoutDate, fromDate, toDate)) {
            tx.push({
              id: `tx-inv-int-${r.id}-p${period}`,
              date: payoutDate,
              category: `Income — FD Interest (${payoutMethod})`,
              inflow: periodic_payout,
              outflow: 0,
              notes: `${payoutMethod.charAt(0).toUpperCase() + payoutMethod.slice(1)} interest payout on ${r.institution || 'FD'}`,
              ts: `${payoutDate}T12:00:00.000Z`,
              source: { store: 'investments', id: r.id, subtype: 'interest' },
              account_id: creditAccountId,
              account_name: creditAcc?.name || 'Unassigned'
            });
          }
        }
      }
      
      // Final maturity: principal + remaining interest (or all interest if at_maturity)
      if (maturity && (!accountId || creditAccountId === accountId) && inDateRange(maturity, fromDate, toDate)) {
        const maturityInflow = payoutMethod === 'at_maturity' ? maturity_value : amount; // Return principal only if interest already paid
        tx.push({ 
          id: `tx-inv-in-${r.id}`, 
          date: maturity, 
          category: `Investment Maturity — ${r.type || 'FD'}`, 
          inflow: maturityInflow, 
          outflow: 0, 
          notes: payoutMethod === 'at_maturity' ? 'Principal + accumulated interest' : 'Principal return', 
          ts: `${maturity}T23:59:59.000Z`, 
          source: { store: 'investments', id: r.id }, 
          account_id: creditAccountId, 
          account_name: creditAcc?.name || 'Unassigned' 
        });
      }
    } else {
      const cashDt = r.cashout_date ? String(r.cashout_date).slice(0,10) : null;
      const cashAmt = Number(r.cashout_amount || 0) || 0;
      if (cashDt && cashAmt > 0 && (!accountId || creditAccountId === accountId) && inDateRange(cashDt, fromDate, toDate)) {
        tx.push({ id: `tx-inv-cash-${r.id}`, date: cashDt, category: `Investment Cashout — ${r.type || 'General'}` , inflow: cashAmt, outflow: 0, notes: r.notes || '', ts: `${cashDt}T23:59:59.000Z`, source: { store: 'investments', id: r.id }, account_id: creditAccountId, account_name: creditAcc?.name || 'Unassigned' });
      }
    }
  }

  // Loans -> inflow on creation (money received); outflow entries for repayments + interest
  for (const r of loans || []) {
    if (accountId && r.account_id !== accountId) continue;
    const start = (r.start_date || r.date || todayISO()).slice(0,10);
    const principal = Number(r.amount_borrowed ?? r.outflow ?? 0) || 0;
    const account = r.account_id ? accountMap.get(r.account_id) : null;
    if (inDateRange(start, fromDate, toDate)) {
      tx.push({ id: `tx-loan-out-${r.id}`, date: start, category: `Loan — ${r.lender || 'Bank'}` , inflow: principal, outflow: 0, notes: r.notes || '', ts: r.createdAt || `${start}T00:00:00.000Z`, source: { store: 'loans', id: r.id }, account_id: r.account_id, account_name: account?.name || 'Unassigned' });
    }
  }

  // Build loan payment history with interest breakdown
  const loanPaymentsByLoan = new Map();
  for (const p of payments || []) {
    if (!loanPaymentsByLoan.has(p.loan_id)) {
      loanPaymentsByLoan.set(p.loan_id, []);
    }
    loanPaymentsByLoan.get(p.loan_id).push(p);
  }

  // Process payments with interest calculation
  for (const loan of loans || []) {
    const loanPayments = loanPaymentsByLoan.get(loan.id) || [];
    loanPayments.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    
    let lastDate = (loan.start_date || loan.date || todayISO()).slice(0, 10);
    let outstandingPrincipal = Number(loan.amount_borrowed ?? 0) || 0;
    const rate = Number(loan.interest_rate || 0);
    
    for (const p of loanPayments) {
      if (accountId && p.account_id !== accountId) continue;
      const dt = p.date?.slice(0, 10) || todayISO();
      if (!inDateRange(dt, fromDate, toDate)) continue;
      
      const paymentAmount = Number(p.amount || 0);
      const account = p.account_id ? accountMap.get(p.account_id) : null;
      
      // Calculate interest and principal breakdown
      let interestPaid = 0;
      let principalPaid = paymentAmount;
      
      if (rate > 0 && outstandingPrincipal > 0) {
        const breakdown = calculatePaymentBreakdown(
          paymentAmount,
          outstandingPrincipal,
          rate,
          lastDate,
          dt
        );
        interestPaid = breakdown.interest;
        principalPaid = breakdown.principal;
      }
      
      // Add principal payment transaction
      if (principalPaid > 0) {
        tx.push({
          id: `tx-loan-pay-${p.id}`,
          date: dt,
          category: `Loan Principal — ${p.lender || loan.lender || ''}`,
          inflow: 0,
          outflow: principalPaid,
          notes: p.notes || '',
          ts: p.createdAt || `${dt}T00:00:00.000Z`,
          source: { store: 'loan_payments', id: p.id, type: 'principal' },
          account_id: p.account_id,
          account_name: account?.name || 'Unassigned'
        });
      }
      
      // Add interest expense transaction
      if (interestPaid > 0) {
        tx.push({
          id: `tx-loan-int-${p.id}`,
          date: dt,
          category: `Interest Expense — ${p.lender || loan.lender || ''}`,
          inflow: 0,
          outflow: interestPaid,
          notes: `Interest on ${p.lender || loan.lender || 'loan'}`,
          ts: p.createdAt || `${dt}T00:00:01.000Z`,
          source: { store: 'loan_payments', id: p.id, type: 'interest' },
          account_id: p.account_id,
          account_name: account?.name || 'Unassigned'
        });
      }
      
      outstandingPrincipal -= principalPaid;
      lastDate = dt;
    }
  }

  // sort by timestamp desc (newest first) - fallback to date, then category
  tx.sort((a,b)=> (String(b.ts||'').localeCompare(String(a.ts||''))
    || (b.date||'').localeCompare(a.date||'')
    || (a.category||'').localeCompare(b.category||'')));
  // add computed net on the fly
  return tx.map(r => ({ ...r, net: (Number(r.inflow)||0) - (Number(r.outflow)||0) }));
}

export async function getDashboardTotals({ fromDate = null, toDate = null } = {}) {
  const [investments, income, expenses, loans, payments] = await Promise.all([
    getAll('investments'), getAll('income'), getAll('expenses'), getAll('loans'), getAll('loan_payments')
  ]);
  const rangeFilter = (d) => inDateRange(String(d||'').slice(0,10), fromDate, toDate);

  // Total invested: sum all active investments regardless of date range (cumulative)
  const totalInvested = (investments||[]).reduce((s,r)=> s + (Number(r.amount||0)), 0);
  const totalIncome = (income||[]).filter(r=>rangeFilter(r.date)).reduce((s,r)=> s + (Number((r.amount ?? r.inflow) || 0)), 0);
  const totalExpenses = (expenses||[]).filter(r=>rangeFilter(r.date)).reduce((s,r)=> s + (Number((r.amount ?? r.outflow) || 0)), 0);

  // Liabilities: outstanding principal + accrued interest
  const byLoan = new Map();
  for (const l of loans||[]) {
    byLoan.set(l.id, { 
      lender: l.lender, 
      borrowed: Number(l.amount_borrowed ?? 0),
      rate: Number(l.interest_rate || 0),
      startDate: (l.start_date || l.date || todayISO()).slice(0, 10),
      principalRepaid: 0,
      interestPaid: 0,
      lastPaymentDate: null
    });
  }
  
  // Calculate principal and interest paid from payments
  for (const p of payments||[]) {
    if (!byLoan.has(p.loan_id)) continue;
    const loanData = byLoan.get(p.loan_id);
    const paymentAmount = Number(p.amount || 0);
    const paymentDate = p.date?.slice(0, 10) || todayISO();
    
    // Calculate interest vs principal for this payment
    const lastDate = loanData.lastPaymentDate || loanData.startDate;
    const outstanding = loanData.borrowed - loanData.principalRepaid;
    
    if (loanData.rate > 0 && outstanding > 0) {
      const breakdown = calculatePaymentBreakdown(
        paymentAmount,
        outstanding,
        loanData.rate,
        lastDate,
        paymentDate
      );
      loanData.interestPaid += breakdown.interest;
      loanData.principalRepaid += breakdown.principal;
    } else {
      loanData.principalRepaid += paymentAmount;
    }
    
    loanData.lastPaymentDate = paymentDate;
  }
  
  let currentLiabilities = 0;
  const today = todayISO(); // used for liability accrual
  
  for (const loanData of byLoan.values()) {
    const outstandingPrincipal = Math.max(0, loanData.borrowed - loanData.principalRepaid);
    
    // Add accrued interest since last payment
    let accruedInterest = 0;
    if (loanData.rate > 0 && outstandingPrincipal > 0) {
      const lastDate = loanData.lastPaymentDate || loanData.startDate;
      accruedInterest = calculateAccruedInterest(outstandingPrincipal, loanData.rate, lastDate, today);
    }
    
    currentLiabilities += outstandingPrincipal + accruedInterest;
  }

  // Realized assets: treat investment principal as reducing net worth until matured/cashed out
  // FD: include maturity value only when maturity date passed. Non-FD: include cashout_amount only when date passed.
  const todayDash = todayISO();
  let realizedAssets = 0;
  for (const inv of investments || []) {
    const amount = Number(inv.amount || 0) || 0;
    const rate = Number(inv.interest_rate || inv.rate || 0) || 0;
    const tenure = Number(inv.tenure_months || inv.tenure || 0) || 0;
  const start = (inv.start_date || inv.date || todayDash).slice(0,10);
    const maturity = (inv.maturity_date && String(inv.maturity_date).slice(0,10)) || (tenure ? addMonths(start, tenure) : null);
    const type = String(inv.type||'').toUpperCase();
    if (type === 'FD') {
      if (maturity && maturity <= todayDash) {
        const { maturity_value } = calculateFD({ amount, interest_rate: rate, tenure_months: tenure });
        realizedAssets += maturity_value;
      }
    } else {
      const cashDt = inv.cashout_date ? String(inv.cashout_date).slice(0,10) : null;
      const cashAmt = Number(inv.cashout_amount || 0) || 0;
      if (cashDt && cashDt <= todayDash && cashAmt > 0) {
        realizedAssets += cashAmt;
      }
    }
  }

  const assets = realizedAssets;
  const netWorth = assets - currentLiabilities;

  // Net P&L from transactions in range
  const tx = await getMasterTransactions({ fromDate, toDate });
  const inflow = tx.reduce((s,r)=> s + (Number(r.inflow)||0), 0);
  const outflow = tx.reduce((s,r)=> s + (Number(r.outflow)||0), 0);
  const netPL = inflow - outflow;

  return { totalInvested, totalIncome, totalExpenses, currentLiabilities, netWorth, netPL, assetsRealized: assets };
}

export async function updateNotesForRecord(store, id, notes) {
  const rec = await get(store, id);
  if (!rec) return null;
  rec.notes = notes;
  return saveRecord(store, rec);
}

// ============= Account Management =============
/**
 * Get account balance by summing all transactions linked to it
 * Returns: { balance, inflows, outflows, transactionCount }
 */
export async function getAccountBalance(accountId) {
  const [income, expenses, investments, loans, payments] = await Promise.all([
    getAll('income'), getAll('expenses'), getAll('investments'), getAll('loans'), getAll('loan_payments')
  ]);
  
  let inflows = 0;
  let outflows = 0;
  let count = 0;
  
  // Income
  for (const r of income || []) {
    if (r.account_id === accountId) {
      inflows += Number(r.amount ?? r.inflow ?? 0) || 0;
      count++;
    }
  }
  
  // Expenses
  for (const r of expenses || []) {
    if (r.account_id === accountId) {
      outflows += Number(r.amount ?? r.outflow ?? 0) || 0;
      count++;
    }
  }
  
  // Investments (outflow on creation, inflow on maturity/cashout + monthly interest)
  const today = todayISO();
  for (const r of investments || []) {
    if (r.account_id === accountId) {
      const amount = Number(r.amount ?? 0) || 0;
      const rate = Number(r.interest_rate || r.rate || 0);
      const tenure = Number(r.tenure_months || r.tenure || 0);
      
      // Initial investment is an outflow from account
      outflows += amount;
      count++;
      
      // FD: Add interest payouts based on payout method
      const invType = (r.type || '').toUpperCase();
      if (invType === 'FD' && rate > 0 && tenure > 0) {
        const start = (r.start_date || r.date || today).slice(0, 10);
        const payoutMethod = r.interest_payout_method || r.payout_method || 'at_maturity';
        const creditAccountId = r.payout_account_id || r.account_id;
        
        // Add interest inflows based on payout method
        if (payoutMethod !== 'at_maturity' && creditAccountId === accountId) {
          const { periodic_payout } = calculateFD({ 
            amount, 
            interest_rate: rate, 
            tenure_months: tenure,
            interest_payout_method: payoutMethod 
          });
          
          // Determine payout frequency
          let payoutFrequency = 1; // monthly
          if (payoutMethod === 'quarterly') payoutFrequency = 3;
          else if (payoutMethod === 'annual') payoutFrequency = 12;
          
          // Count payouts that have occurred
          const totalPayouts = Math.floor(tenure / payoutFrequency);
          for (let period = 1; period <= totalPayouts; period++) {
            const payoutDate = addMonths(start, period * payoutFrequency);
            if (payoutDate <= today) {
              inflows += periodic_payout;
            }
          }
        }
        
        // Add maturity principal (+ interest if at_maturity) return only if maturity date has passed
        const maturity = (r.maturity_date && String(r.maturity_date).slice(0, 10)) || addMonths(start, tenure);
        if (creditAccountId === accountId && maturity <= today) {
          if (payoutMethod === 'at_maturity') {
            // Return principal + all accumulated interest
            const { maturity_value } = calculateFD({ amount, interest_rate: rate, tenure_months: tenure });
            inflows += maturity_value;
          } else {
            // Return principal only (interest already paid periodically)
            inflows += amount;
          }
        }
      } else if (r.cashout_amount && r.cashout_date) {
        // Non-FD investments: only count cashout if it has occurred
        const cashDate = String(r.cashout_date).slice(0, 10);
        const creditAccountId = r.payout_account_id || r.account_id;
        if (creditAccountId === accountId && cashDate <= today) {
          inflows += Number(r.cashout_amount || 0);
        }
      }
    }
  }
  
  // Loans (inflow on creation)
  for (const r of loans || []) {
    if (r.account_id === accountId) {
      inflows += Number(r.amount_borrowed ?? 0) || 0;
      count++;
    }
  }
  
  // Loan payments (outflows)
  for (const p of payments || []) {
    if (p.account_id === accountId) {
      outflows += Number(p.amount || 0) || 0;
      count++;
    }
  }
  
  return { 
    balance: inflows - outflows, 
    inflows, 
    outflows, 
    transactionCount: count 
  };
}

/**
 * Get summary statistics across all accounts
 * Returns: { totalBalance, accountCount, accounts: [{id, name, balance},...] }
 */
export async function getAllAccountsSummary() {
  const accounts = await getAll('accounts') || [];
  const activeAccounts = accounts.filter(a => a.status !== 'archived');
  
  const summaries = await Promise.all(
    activeAccounts.map(async (acc) => {
      const { balance } = await getAccountBalance(acc.id);
      return {
        id: acc.id,
        name: acc.name,
        type: acc.type,
        institution: acc.institution,
        balance,
        currency: acc.currency || 'INR'
      };
    })
  );
  
  const totalBalance = summaries.reduce((sum, a) => sum + a.balance, 0);
  
  return {
    totalBalance,
    accountCount: activeAccounts.length,
    accounts: summaries
  };
}
