import API_BASE_URL from '../config/api.js';
import {
  listInvestments, listIncome, listExpenses, listLoans, listLoanPayments, listAccounts,
  saveInvestment, saveIncome, saveExpense, saveLoan, saveLoanPayment, saveAccount,
  deleteInvestment, deleteIncome, deleteExpense, deleteLoan, deleteLoanPayment, deleteAccount,
  listAuditsSince
} from '../db/stores/financeStore.js';

const SYNC_KEY = 'finance_last_sync_at';

async function getAllLocalRecordsSince(sinceIso = '') {
  const since = sinceIso ? new Date(sinceIso) : null;
  const [investments, income, expenses, loans, loanPayments, accounts, audits] = await Promise.all([
    listInvestments(), listIncome(), listExpenses(), listLoans(), listLoanPayments(), listAccounts(), listAuditsSince(sinceIso)
  ]);
  const map = new Map(); // key: `${store}:${id}` -> record
  const wrap = (store, arr) => {
    for (const r of arr || []) {
      if (since && (!r.updatedAt || new Date(r.updatedAt) <= since)) continue;
      const key = `${store}:${r.id}`;
      map.set(key, { store, id: r.id, data: r, updatedAt: r.updatedAt || new Date().toISOString() });
    }
  };
  wrap('investments', investments);
  wrap('income', income);
  wrap('expenses', expenses);
  wrap('loans', loans);
  wrap('loan_payments', loanPayments);
  wrap('accounts', accounts);

  // Convert delete audits to tombstones; prefer the newer of update vs delete
  for (const a of audits || []) {
    if (a.action !== 'delete' || !a.store || !a.item_id) continue;
    const key = `${a.store}:${a.item_id}`;
    const ts = a.timestamp || new Date().toISOString();
    const current = map.get(key);
    const currentTs = current?.updatedAt ? new Date(current.updatedAt) : null;
    if (!current || (currentTs && new Date(ts) >= currentTs)) {
      map.set(key, { store: a.store, id: a.item_id, data: null, deleted: true, updatedAt: ts });
    }
  }

  return Array.from(map.values());
}

async function applyRemoteRecords(records = []) {
  for (const r of records) {
    const { store, id, data, deleted } = r;
    // simple conflict detection: skip applying if local is newer than remote
    const localUpdated = data?.updatedAt ? new Date(data.updatedAt) : null;
    const remoteUpdated = r.updatedAt ? new Date(r.updatedAt) : null;
    if (localUpdated && remoteUpdated && localUpdated > remoteUpdated) {
      try {
        const key = 'finance_conflicts';
        const prev = JSON.parse(localStorage.getItem(key) || '[]');
        prev.push({ store, id, localUpdated: data.updatedAt, remoteUpdated: r.updatedAt });
        localStorage.setItem(key, JSON.stringify(prev));
      } catch {}
      continue;
    }
    if (deleted) {
      if (store === 'investments') await deleteInvestment(id);
      else if (store === 'income') await deleteIncome(id);
      else if (store === 'expenses') await deleteExpense(id);
      else if (store === 'loans') await deleteLoan(id);
      else if (store === 'loan_payments') await deleteLoanPayment(id);
      else if (store === 'accounts') await deleteAccount(id);
      continue;
    }
    if (store === 'investments') await saveInvestment({ ...data, id });
    else if (store === 'income') await saveIncome({ ...data, id });
    else if (store === 'expenses') await saveExpense({ ...data, id });
    else if (store === 'loans') await saveLoan({ ...data, id });
    else if (store === 'loan_payments') await saveLoanPayment({ ...data, id });
    else if (store === 'accounts') await saveAccount({ ...data, id });
  }
}

export async function syncNow() {
  try {
    const since = localStorage.getItem(SYNC_KEY) || '';
    localStorage.setItem('finance_sync_status', 'syncing');
    // Push only changed records since last sync
    const records = await getAllLocalRecordsSince(since);
    await fetch(`${API_BASE_URL}/finance/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records })
    });

    // Pull remote changes since last sync
    const pullRes = await fetch(`${API_BASE_URL}/finance/pull${since ? `?since=${encodeURIComponent(since)}` : ''}`);
    if (pullRes.ok) {
      const payload = await pullRes.json();
      await applyRemoteRecords(payload.records || []);
    }
    const now = new Date().toISOString();
    localStorage.setItem(SYNC_KEY, now);
    localStorage.setItem('finance_sync_status', 'synced');
    return { ok: true };
  } catch (e) {
    // Best-effort sync; ignore failures
    localStorage.setItem('finance_sync_status', 'error');
    return { ok: false, error: e?.message };
  }
}

let timer = null;
export function startBackgroundSync(intervalMs = 120000) {
  if (timer) return;
  // Run once immediately, then on an interval
  syncNow();
  timer = setInterval(syncNow, intervalMs);
}

export function stopBackgroundSync() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
