import React, { useEffect, useState } from 'react';
import './finance.css';
import FinanceNav from './FinanceNav.jsx';
import { getMasterTransactions } from '../../db/stores/financeStore';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatCurrencyValue } from '../../utils/format';
import SyncStatus from './SyncStatus.jsx';

export default function FinanceLayout({ title, children }) {
  const { settings } = useSettings();
  const [totals, setTotals] = useState({ inflow: 0, outflow: 0, net: 0 });

  useEffect(() => {
    (async () => {
      const now = new Date();
      let fromDate = null, toDate = null;
      if (settings.defaultPeriod === 'this_month') {
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        fromDate = `${y}-${m}-01`;
        toDate = new Date(y, now.getMonth() + 1, 0).toISOString().slice(0, 10);
      } else if (settings.defaultPeriod === 'this_year') {
        const y = now.getFullYear();
        fromDate = `${y}-01-01`;
        toDate = `${y}-12-31`;
      }
      const transactions = await getMasterTransactions({ fromDate, toDate });
      const inflow = transactions.reduce((s, r) => s + (Number(r.inflow) || 0), 0);
      const outflow = transactions.reduce((s, r) => s + (Number(r.outflow) || 0), 0);
      setTotals({ inflow, outflow, net: inflow - outflow });
    })();
  }, [settings.defaultPeriod]);

  const fmt = (n) => formatCurrencyValue(n, settings);

  return (
    <div className="finance-layout">
      <FinanceNav />
      <header className="finance-header">
        <div>
          <h1 className="finance-title">{title}</h1>
          <p className="finance-sub">Period: {settings.defaultPeriod.replace('_',' ')}</p>
        </div>
        <div className="kpi-row">
          <div className="kpi">
            <div className="kpi-label">Total Inflow</div>
            <div className="kpi-value">{fmt(totals.inflow)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Total Outflow</div>
            <div className="kpi-value">{fmt(totals.outflow)}</div>
          </div>
          <div className="kpi kpi-accent">
            <div className="kpi-label">Net</div>
            <div className="kpi-value">{fmt(totals.net)}</div>
          </div>
          <div style={{ marginLeft: 8 }}>
            <SyncStatus />
          </div>
        </div>
      </header>
      <main className="finance-content">
        {children}
      </main>
    </div>
  );
}
