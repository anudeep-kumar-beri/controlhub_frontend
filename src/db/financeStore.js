// financeStore.js — thin layer over IndexedDB adapter
import { getAll, put, del } from './indexedDBAdapter';

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

// Generic save helpers
export async function saveRecord(store, record) {
  if (!record.id) {
    record.id = `${store}-${Date.now()}`;
  }
  await put(store, record);
  return record;
}

export async function saveInvestment(inv) { return saveRecord('investments', inv); }
export async function saveIncome(rec) { return saveRecord('income', rec); }
export async function saveExpense(rec) { return saveRecord('expenses', rec); }
export async function saveLoan(rec) { return saveRecord('loans', rec); }

export async function deleteInvestment(id){ return del('investments', id); }
export async function deleteIncome(id){ return del('income', id); }
export async function deleteExpense(id){ return del('expenses', id); }
export async function deleteLoan(id){ return del('loans', id); }

export async function saveOverride(rowId, override) {
  // override: { inflow?, outflow?, notes? }
  const o = Object.assign({ id: rowId, timestamp: new Date().toISOString() }, override);
  await put('overrides', o);
  return o;
}

export async function listOverrides() { return getAll('overrides'); }

function parseMonthKey(d) {
  // accept ISO date string or Date
  const date = d ? new Date(d) : null;
  if (!date || isNaN(date)) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export async function getMasterRows({ fromMonth = null, toMonth = null } = {}) {
  // fromMonth/toMonth: 'YYYY-MM' strings or null
  const [investments, income, expenses, loans, overrides] = await Promise.all([
    getAll('investments'),
    getAll('income'),
    getAll('expenses'),
    getAll('loans'),
    getAll('overrides')
  ]);

  // Utility to filter by month if date field exists
  function inRange(itemDate) {
    if (!fromMonth && !toMonth) return true;
    if (!itemDate) return true;
    const key = parseMonthKey(itemDate);
    if (!key) return true;
    if (fromMonth && key < fromMonth) return false;
    if (toMonth && key > toMonth) return false;
    return true;
  }

  const rows = [];

  // Investments -> treat as inflow (money placed) for master sheet
  const invInflow = (investments || []).filter(i => inRange(i.start_date || i.date)).reduce((s, i) => s + (Number(i.inflow ?? i.amount ?? 0) || 0), 0);
  rows.push({ id: 'investments', label: 'Investments', inflow_total: invInflow, outflow_total: 0, notes: 'FD + SIP summary' });

  // Income
  const incomeInflow = (income || []).filter(i => inRange(i.date)).reduce((s, i) => s + (Number(i.inflow ?? 0) || 0), 0);
  rows.push({ id: 'income', label: 'Income', inflow_total: incomeInflow, outflow_total: 0, notes: 'Salary and other inflows' });

  // Expenses
  const expensesOutflow = (expenses || []).filter(e => inRange(e.date)).reduce((s, e) => s + (Number(e.outflow ?? 0) || 0), 0);
  rows.push({ id: 'expenses', label: 'Expenses', inflow_total: 0, outflow_total: expensesOutflow, notes: 'Monthly expenses' });

  // Loans - treat as liability; show outstanding as outflow for period (simple)
  const loansOutflow = (loans || []).filter(l => inRange(l.start_date || l.date)).reduce((s, l) => s + (Number(l.outflow ?? 0) || 0), 0);
  rows.push({ id: 'loans', label: 'Loans', inflow_total: 0, outflow_total: loansOutflow, notes: 'Liabilities' });

  // Attach overrides if present
  for (const r of rows) {
    const ov = (overrides || []).find(o => o.id === r.id);
    if (ov) {
      r.override = ov;
      // allow overriding numbers
      if (ov.inflow != null) r.inflow_total = Number(ov.inflow);
      if (ov.outflow != null) r.outflow_total = Number(ov.outflow);
      if (ov.notes != null) r.notes = ov.notes;
    }
    r.net = (Number(r.inflow_total) || 0) - (Number(r.outflow_total) || 0);
  }

  return rows;
}
