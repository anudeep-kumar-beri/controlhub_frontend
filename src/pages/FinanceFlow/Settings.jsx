import React from 'react';
import FinanceNav from '../../components/finance/FinanceNav';

export default function Settings() {
  return (
    <div className="page finance-settings">
      <FinanceNav />
      <h1>FinanceFlow Settings</h1>
      <ul>
        <li>Backup/Restore (local export/import)</li>
        <li>Optional cloud sync toggle (future)</li>
        <li>Theme choice</li>
      </ul>
    </div>
  );
}
