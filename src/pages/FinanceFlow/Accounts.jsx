import React, { useEffect, useMemo, useState } from 'react';
import FinanceLayout from '../../components/finance/FinanceLayout.jsx';
import { listAccounts, saveAccount, deleteWithAudit, getAccountBalance, ensureDisplayOrder, moveItemUp, moveItemDown } from '../../db/stores/financeStore';
import { useCurrencyFormatter } from '../../utils/format';

const ACCOUNT_TYPES = ['Checking', 'Savings', 'Credit Card', 'Investment', 'Cash', 'Other'];
const ACCOUNT_STATUS = ['active', 'archived'];

export default function Accounts() {
  const [items, setItems] = useState([]);
  const [balances, setBalances] = useState(new Map());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    type: 'Checking', 
    institution: '', 
    last4: '',
    currency: 'INR', 
    status: 'active',
    credit_limit: 0,
    notes: '' 
  });
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ q: '', type: '', status: 'active', sort: 'name_asc' });
  const fmt = useCurrencyFormatter();

  async function load() {
    await ensureDisplayOrder('accounts');
    const accounts = await listAccounts();
    setItems(accounts);
    
    // Load balances for all accounts
    const balanceMap = new Map();
    await Promise.all(
      accounts.map(async (acc) => {
        const { balance, inflows, outflows, transactionCount } = await getAccountBalance(acc.id);
        balanceMap.set(acc.id, { balance, inflows, outflows, transactionCount });
      })
    );
    setBalances(balanceMap);
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!form.name) { 
      setError('Account name required'); 
      return; 
    }
    await saveAccount({ ...form, opening_balance: 0 });
    setShowForm(false);
    setForm({ 
      name: '', 
      type: 'Checking', 
      institution: '', 
      last4: '',
      currency: 'INR', 
      status: 'active',
      credit_limit: 0,
      notes: '' 
    });
    setError('');
    await load();
  }

  async function saveEdit() {
    if (!edit.name) { 
      setError('Account name required'); 
      return; 
    }
    await saveAccount(edit);
    setEdit(null);
    setError('');
    await load();
  }

  async function remove(id) {
    const balance = balances.get(id);
    if (balance && balance.transactionCount > 0) {
      if (!window.confirm(`This account has ${balance.transactionCount} transactions. Delete anyway?`)) return;
    }
    await deleteWithAudit('accounts', id);
    await load();
  }

  async function archive(id) {
    const acc = items.find(a => a.id === id);
    if (!acc) return;
    await saveAccount({ ...acc, status: 'archived' });
    await load();
  }

  const filtered = useMemo(() => {
    let arr = items.slice();
    if (filter.q) {
      arr = arr.filter(i => 
        (i.name || '').toLowerCase().includes(filter.q.toLowerCase()) ||
        (i.institution || '').toLowerCase().includes(filter.q.toLowerCase()) ||
        (i.last4 || '').toLowerCase().includes(filter.q.toLowerCase())
      );
    }
    if (filter.type) arr = arr.filter(i => (i.type || '') === filter.type);
    if (filter.status) arr = arr.filter(i => (i.status || 'active') === filter.status);

    if (filter.sort === 'name_asc') arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (filter.sort === 'name_desc') arr.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    else if (filter.sort === 'balance_desc') {
      arr.sort((a, b) => {
        const balA = balances.get(a.id)?.balance || 0;
        const balB = balances.get(b.id)?.balance || 0;
        return balB - balA;
      });
    } else if (filter.sort === 'balance_asc') {
      arr.sort((a, b) => {
        const balA = balances.get(a.id)?.balance || 0;
        const balB = balances.get(b.id)?.balance || 0;
        return balA - balB;
      });
    } else {
      // Default: sort by display_order
      arr.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }
    return arr;
  }, [items, filter, balances]);

  async function handleMoveUp(item) {
    await moveItemUp('accounts', item, items);
    await load();
  }

  async function handleMoveDown(item) {
    await moveItemDown('accounts', item, items);
    await load();
  }

  const totals = useMemo(() => {
    const active = filtered.filter(a => a.status !== 'archived');
    const totalBalance = active.reduce((sum, a) => sum + (balances.get(a.id)?.balance || 0), 0);
    const totalAccounts = active.length;
    const creditCards = active.filter(a => a.type === 'Credit Card');
    const totalCreditLimit = creditCards.reduce((sum, a) => sum + (Number(a.credit_limit || 0)), 0);
    const totalCreditUsed = creditCards.reduce((sum, a) => {
      const bal = balances.get(a.id)?.balance || 0;
      return sum + Math.abs(Math.min(0, bal));
    }, 0);
    const totalCreditAvailable = totalCreditLimit - totalCreditUsed;
    
    return { totalBalance, totalAccounts, totalCreditLimit, totalCreditUsed, totalCreditAvailable };
  }, [filtered, balances]);

  return (
    <FinanceLayout title="Accounts & Cards">
      {/* Summary Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:12,marginBottom:16}}>
        <div className="card" style={{padding:12}}>
          <div style={{fontSize:'0.8rem',opacity:0.7,marginBottom:4}}>Total Balance</div>
          <div style={{fontSize:'1.5rem',fontWeight:'600'}}>{fmt(totals.totalBalance)}</div>
          <div style={{fontSize:'0.75rem',opacity:0.6,marginTop:4}}>{totals.totalAccounts} active accounts</div>
        </div>
        <div className="card" style={{padding:12}}>
          <div style={{fontSize:'0.8rem',opacity:0.7,marginBottom:4}}>Credit Available</div>
          <div style={{fontSize:'1.5rem',fontWeight:'600',color:'#4ade80'}}>{fmt(totals.totalCreditAvailable)}</div>
          <div style={{fontSize:'0.75rem',opacity:0.6,marginTop:4}}>
            Used: {fmt(totals.totalCreditUsed)} / {fmt(totals.totalCreditLimit)}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar" style={{ marginBottom: 12 }}>
        <button className="btn primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Account'}
        </button>
        <input
          type="search"
          placeholder="Search accounts..."
          value={filter.q}
          onChange={(e) => setFilter({ ...filter, q: e.target.value })}
        />
        <label>
          Type:
          <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}>
            <option value="">All</option>
            {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>
          Status:
          <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All</option>
            {ACCOUNT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>
          Sort:
          <select value={filter.sort} onChange={(e) => setFilter({ ...filter, sort: e.target.value })}>
            <option value="name_asc">Name ↑</option>
            <option value="name_desc">Name ↓</option>
            <option value="balance_desc">Balance ↓</option>
            <option value="balance_asc">Balance ↑</option>
          </select>
        </label>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-header"><strong>Add Account/Card</strong></div>
          <div className="card-body" style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <label>
              Name: <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., HDFC Savings" required />
            </label>
            <label>
              Type:
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label>
              Institution: <input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} placeholder="Bank name" />
            </label>
            <label>
              Last 4 Digits: <input value={form.last4} onChange={(e) => setForm({ ...form, last4: e.target.value.slice(0,4) })} placeholder="1234" maxLength={4} />
            </label>
            <label>
              Currency:
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </label>
            {form.type === 'Credit Card' && (
              <label>
                Credit Limit: <input type="number" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: Number(e.target.value) })} />
              </label>
            )}
            <label style={{gridColumn:'1/-1'}}>
              Notes: <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
            <div style={{gridColumn:'1/-1'}}>
              <button className="btn accent" onClick={add}>Save Account</button>
              {error && <span style={{ color: '#ef4444', marginLeft: 8 }}>{error}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Account List */}
      <div className="card">
        <div className="card-header"><strong>Accounts & Cards</strong></div>
        <div className="card-body">
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, opacity: 0.6 }}>
              No accounts found. Add your first account or card to get started.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', width: '25%' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', width: '12%' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', width: '15%' }}>Institution</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px', width: '10%' }}>Last 4</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', width: '12%' }}>Balance</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px', width: '8%' }}>Txns</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px', width: '8%' }}>Status</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px', width: '10%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const balance = balances.get(item.id);
                  const isEditing = edit && edit.id === item.id;
                  
                  if (isEditing) {
                    return (
                      <tr key={item.id} style={{ background: 'rgba(100, 100, 100, 0.1)' }}>
                        <td colSpan={8}>
                          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                            <label>Name: <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
                            <label>Type:
                              <select value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value })}>
                                {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </label>
                            <label>Institution: <input value={edit.institution || ''} onChange={(e) => setEdit({ ...edit, institution: e.target.value })} /></label>
                            <label>Last 4: <input value={edit.last4 || ''} onChange={(e) => setEdit({ ...edit, last4: e.target.value.slice(0,4) })} maxLength={4} /></label>
                            <label>Currency:
                              <select value={edit.currency || 'INR'} onChange={(e) => setEdit({ ...edit, currency: e.target.value })}>
                                <option value="INR">INR</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                              </select>
                            </label>
                            {edit.type === 'Credit Card' && (
                              <label>Credit Limit: <input type="number" value={edit.credit_limit || 0} onChange={(e) => setEdit({ ...edit, credit_limit: Number(e.target.value) })} /></label>
                            )}
                            <label>Status:
                              <select value={edit.status || 'active'} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                                {ACCOUNT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </label>
                            <label style={{gridColumn:'1/-1'}}>Notes: <input value={edit.notes || ''} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></label>
                            <div style={{gridColumn:'1/-1'}}>
                              <button className="btn accent" onClick={saveEdit}>Save</button>
                              <button className="btn" onClick={() => setEdit(null)} style={{ marginLeft: 8 }}>Cancel</button>
                              {error && <span style={{ color: '#ef4444', marginLeft: 8 }}>{error}</span>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 8px', textAlign: 'left' }}>
                        <div style={{fontWeight:'500'}}>{item.name}</div>
                        {item.notes && <div style={{fontSize:'0.8rem',opacity:0.6}}>{item.notes}</div>}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'left' }}>{item.type}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'left' }}>{item.institution || '—'}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', fontFamily:'monospace' }}>{item.last4 ? `••••${item.last4}` : '—'}</td>
                      <td style={{
                        padding: '12px 8px',
                        textAlign: 'right',
                        fontWeight:'600',
                        color: (balance?.balance || 0) >= 0 ? '#4ade80' : '#f87171'
                      }}>
                        {balance ? fmt(balance.balance) : '—'}
                        {item.type === 'Credit Card' && item.credit_limit > 0 && (
                          <div style={{fontSize:'0.75rem',opacity:0.7,fontWeight:'400'}}>
                            Limit: {fmt(item.credit_limit)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>{balance?.transactionCount || 0}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <span style={{
                          padding:'2px 8px',
                          borderRadius:4,
                          fontSize:'0.75rem',
                          background: item.status === 'archived' ? 'rgba(100,100,100,0.2)' : 'rgba(74,222,128,0.2)',
                          color: item.status === 'archived' ? '#999' : '#4ade80'
                        }}>
                          {item.status || 'active'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <button className="btn-icon" onClick={() => handleMoveUp(item)} title="Move Up" disabled={filtered.indexOf(item) === 0}>⬆️</button>
                        <button className="btn-icon" onClick={() => handleMoveDown(item)} title="Move Down" disabled={filtered.indexOf(item) === filtered.length - 1}>⬇️</button>
                        <button className="btn-icon" onClick={() => setEdit(item)} title="Edit">✏️</button>
                        {item.status !== 'archived' && (
                          <button className="btn-icon" onClick={() => archive(item.id)} title="Archive">📦</button>
                        )}
                        <button className="btn-icon" onClick={() => remove(item.id)} title="Delete">🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </FinanceLayout>
  );
}
