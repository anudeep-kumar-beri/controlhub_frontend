import React, { useEffect } from 'react';
import FinanceNav from '../../components/finance/FinanceNav';
import { seedIfEmpty } from '../../db/financeStore';
import { startBackgroundSync } from '../../sync/financeSync';

export default function FinanceDashboard() {
  useEffect(() => {
    // Seed a few demo rows on first visit so pages aren't empty.
    seedIfEmpty().catch(() => {});
    // Start background sync (best-effort)
    startBackgroundSync();
  }, []);
  return (
    <div className="page finance-dashboard">
      <FinanceNav />
      <h1>FinanceFlow — Dashboard</h1>
      <p>Overview: Total Invested, Current Value, Net P&L, Net Worth (coming soon).</p>
      <ul>
        <li>Quick links to ledgers and Master Plus/Minus Sheet.</li>
        <li>Small trend sparkline placeholders.</li>
      </ul>
    </div>
  );
}
