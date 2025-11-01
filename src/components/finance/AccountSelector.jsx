import React, { useEffect, useState } from 'react';
import { listAccounts } from '../../db/stores/financeStore';

export default function AccountSelector({ value, onChange, allowUnassigned = true, filterType = null }) {
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    (async () => {
      const all = await listAccounts();
      const active = all.filter(a => a.status !== 'archived');
      const filtered = filterType 
        ? active.filter(a => a.type === filterType)
        : active;
      setAccounts(filtered);
    })();
  }, [filterType]);

  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
      {allowUnassigned && <option value="">Unassigned</option>}
      {accounts.map(acc => (
        <option key={acc.id} value={acc.id}>
          {acc.name} {acc.last4 ? `(••${acc.last4})` : ''} — {acc.type}
        </option>
      ))}
      {accounts.length === 0 && !allowUnassigned && (
        <option value="" disabled>No accounts available</option>
      )}
    </select>
  );
}
