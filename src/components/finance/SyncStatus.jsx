import React, { useEffect, useState } from 'react';
import { syncNow } from '../../sync/financeSync';

function timeAgo(iso) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

export default function SyncStatus() {
  const [last, setLast] = useState(localStorage.getItem('finance_last_sync_at') || '');
  const [status, setStatus] = useState(localStorage.getItem('finance_sync_status') || 'idle');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const i = setInterval(() => {
      setLast(localStorage.getItem('finance_last_sync_at') || '');
      setStatus(localStorage.getItem('finance_sync_status') || 'idle');
    }, 1000);
    return () => clearInterval(i);
  }, []);

  async function handleSync() {
    if (busy) return;
    setBusy(true);
    setStatus('syncing');
    await syncNow();
    setLast(localStorage.getItem('finance_last_sync_at') || '');
    setStatus(localStorage.getItem('finance_sync_status') || 'synced');
    setBusy(false);
  }

  const pillClass = status === 'error' ? 'pill danger' : 'pill success';
  const label = status === 'syncing' ? 'Syncing…' : status === 'error' ? 'Error' : 'Synced';
  return (
    <div className="sync-status">
      <span className={pillClass}>{label}</span>
      <span className="muted">• {timeAgo(last)}</span>
      <button className="btn icon" onClick={handleSync} disabled={busy} title="Sync now">↻</button>
    </div>
  );
}
