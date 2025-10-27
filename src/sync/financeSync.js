import API_BASE_URL from '../config/api.js';
import {
  listInvestments, listIncome, listExpenses, listLoans, listOverrides,
  saveInvestment, saveIncome, saveExpense, saveLoan, saveOverride,
  deleteInvestment, deleteIncome, deleteExpense, deleteLoan
} from '../db/financeStore.js';

const SYNC_KEY = 'finance_last_sync_at';

async function getAllLocalRecords() {
  const [investments, income, expenses, loans, overrides] = await Promise.all([
    listInvestments(), listIncome(), listExpenses(), listLoans(), listOverrides()
  ]);
  const nowIso = new Date().toISOString();
  const wrap = (store, arr) => arr.map(r => ({ store, id: r.id, data: r, updatedAt: nowIso }));
  return [
    ...wrap('investments', investments),
    ...wrap('income', income),
    ...wrap('expenses', expenses),
    ...wrap('loans', loans),
    ...wrap('overrides', overrides)
  ];
}

async function applyRemoteRecords(records = []) {
  for (const r of records) {
    const { store, id, data, deleted } = r;
    if (deleted) {
      if (store === 'investments') await deleteInvestment(id);
      else if (store === 'income') await deleteIncome(id);
      else if (store === 'expenses') await deleteExpense(id);
      else if (store === 'loans') await deleteLoan(id);
      // overrides deletions are ignored in this simple model; they can be overwritten instead
      continue;
    }
    if (store === 'investments') await saveInvestment({ ...data, id });
    else if (store === 'income') await saveIncome({ ...data, id });
    else if (store === 'expenses') await saveExpense({ ...data, id });
    else if (store === 'loans') await saveLoan({ ...data, id });
    else if (store === 'overrides') await saveOverride(id, data);
  }
}

export async function syncNow() {
  try {
    // Push local snapshot (naive full-snapshot strategy)
    const records = await getAllLocalRecords();
    await fetch(`${API_BASE_URL}/finance/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records })
    });

    // Pull remote changes since last sync
    const since = localStorage.getItem(SYNC_KEY) || '';
    const pullRes = await fetch(`${API_BASE_URL}/finance/pull${since ? `?since=${encodeURIComponent(since)}` : ''}`);
    if (pullRes.ok) {
      const payload = await pullRes.json();
      await applyRemoteRecords(payload.records || []);
    }
    const now = new Date().toISOString();
    localStorage.setItem(SYNC_KEY, now);
    return { ok: true };
  } catch (e) {
    // Best-effort sync; ignore failures
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
