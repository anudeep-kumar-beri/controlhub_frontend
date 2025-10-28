import React, { useState } from 'react';
import FinanceLayout from '../../components/finance/FinanceLayout.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { listInvestments, listIncome, listExpenses, listLoans, saveInvestment, saveIncome, saveExpense, saveLoan } from '../../db/stores/financeStore';

export default function Settings() {
  const { settings, setSettings } = useSettings();
  const [busy, setBusy] = useState(false);

  async function exportBackup() {
    setBusy(true);
    const payload = {
      meta: { app: 'ControlHub FinanceFlow', version: 1, exportedAt: new Date().toISOString() },
      data: {
        investments: await listInvestments(),
        income: await listIncome(),
        expenses: await listExpenses(),
        loans: await listLoans()
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `financeflow-backup-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    setBusy(false);
  }

  async function importBackup(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true);
    const text = await file.text();
    try {
      const payload = JSON.parse(text);
      const { investments = [], income = [], expenses = [], loans = [] } = payload.data || {};
      for (const r of investments) await saveInvestment(r);
      for (const r of income) await saveIncome(r);
      for (const r of expenses) await saveExpense(r);
      for (const r of loans) await saveLoan(r);
      alert('Backup imported successfully.');
    } catch (err) {
      alert('Failed to import backup: ' + (err?.message || err));
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  function handleSettingsChange(field, value) {
    setSettings(s => ({ ...s, [field]: value }));
  }
  return (
    <FinanceLayout title="FinanceFlow Settings">
      <div className="card" style={{maxWidth:560, marginBottom:12}}>
        <div className="card-header"><strong>Preferences</strong></div>
        <div className="card-body" style={{display:'grid',gap:12}}>
          <label>Currency code: <input value={settings.currencyCode} onChange={(e)=>handleSettingsChange('currencyCode', e.target.value)} /></label>
          <label>Locale: <input value={settings.locale} onChange={(e)=>handleSettingsChange('locale', e.target.value)} placeholder="e.g., en-IN" /></label>
          <label>Fiscal year start month: 
            <input type="number" min="1" max="12" value={settings.fiscalYearStartMonth} onChange={(e)=>handleSettingsChange('fiscalYearStartMonth', Number(e.target.value)||1)} />
          </label>
          <label>Default period:
            <select value={settings.defaultPeriod} onChange={(e)=>handleSettingsChange('defaultPeriod', e.target.value)}>
              <option value="this_month">This month</option>
              <option value="this_year">This year</option>
              <option value="all">All</option>
            </select>
          </label>
        </div>
      </div>

      <div className="card" style={{maxWidth:560}}>
        <div className="card-header"><strong>Backup & Restore</strong></div>
        <div className="card-body" style={{display:'flex',gap:12,alignItems:'center'}}>
          <button className="btn" onClick={exportBackup} disabled={busy}>Export JSON</button>
          <label>
            <input type="file" accept="application/json" style={{display:'none'}} onChange={importBackup} />
            <span className="btn">Import JSON</span>
          </label>
        </div>
      </div>
    </FinanceLayout>
  );
}
