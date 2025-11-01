import React, { useEffect, useMemo, useState } from 'react';
import FinanceLayout from '../../components/finance/FinanceLayout.jsx';
import { listIncome, saveIncome, deleteWithAudit } from '../../db/stores/financeStore';
import SimpleModal from '../../components/common/SimpleModal';
import { useCurrencyFormatter, todayISO } from '../../utils/format';
import AccountSelector from '../../components/finance/AccountSelector.jsx';

export default function Income() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ source:'', category:'General', amount:0, date: todayISO(), recurrence:'one-time', tags:'', notes:'', account_id: null });
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ q:'', category:'', from:'', to:'', sort:'date_desc' });
  const fmt = useCurrencyFormatter();

  async function load(){ setItems(await listIncome()); }
  useEffect(()=>{ load(); }, []);

  async function add(){ if(!form.source || Number(form.amount)<=0){ setError('Source and positive amount required'); return;} await saveIncome({ ...form, inflow: form.amount, label: form.source }); setShowForm(false); setForm({ source:'', category:'General', amount:0, date: todayISO(), recurrence:'one-time', tags:'', notes:'', account_id: null }); setError(''); await load(); }
  async function saveEdit(){ if((!edit.source && !edit.label) || Number((edit.amount ?? edit.inflow) || 0)<=0){ setError('Source and positive amount required'); return;} const toSave = { ...edit, amount: Number((edit.amount ?? edit.inflow) || 0), inflow: Number((edit.amount ?? edit.inflow) || 0), label: edit.source || edit.label }; await saveIncome(toSave); setEdit(null); setError(''); await load(); }
  async function remove(id){ if(!window.confirm('Delete this income?')) return; await deleteWithAudit('income', id); await load(); }

  const filtered = useMemo(()=>{
    let arr = items.slice();
    if (filter.q) arr = arr.filter(i => ((i.source||i.label||'')+(i.tags?' '+i.tags:'' )).toLowerCase().includes(filter.q.toLowerCase()));
    if (filter.category) arr = arr.filter(i => (i.category||'') === filter.category);
    if (filter.from) arr = arr.filter(i => (i.date||'') >= filter.from);
    if (filter.to) arr = arr.filter(i => (i.date||'') <= filter.to);
    const amt = (x)=> Number((x.amount ?? x.inflow) || 0);
    if (filter.sort === 'amount_desc') arr.sort((a,b)=> (amt(b) - amt(a)));
    else if (filter.sort === 'amount_asc') arr.sort((a,b)=> (amt(a) - amt(b)));
    else if (filter.sort === 'date_asc') arr.sort((a,b)=> String(a.date||'').localeCompare(String(b.date||'')));
    else arr.sort((a,b)=> String(b.date||'').localeCompare(String(a.date||'')));
    return arr;
  }, [items, filter]);

  return (
    <FinanceLayout title="Income">
      <div className="toolbar" style={{marginBottom:12}}>
        <button className="btn primary" onClick={()=>setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add income'}</button>
        <input type="search" placeholder="Search source/tags" value={filter.q} onChange={(e)=>setFilter({...filter,q:e.target.value})} />
        <label>Category:
          <input value={filter.category} onChange={(e)=>setFilter({...filter,category:e.target.value})} placeholder="e.g., Salary" />
        </label>
        <label>From: <input type="date" value={filter.from} onChange={(e)=>setFilter({...filter,from:e.target.value})} /></label>
        <label>To: <input type="date" value={filter.to} onChange={(e)=>setFilter({...filter,to:e.target.value})} /></label>
        <label>Sort:
          <select value={filter.sort} onChange={(e)=>setFilter({...filter,sort:e.target.value})}>
            <option value="date_desc">Date ↓</option>
            <option value="date_asc">Date ↑</option>
            <option value="amount_desc">Amount ↓</option>
            <option value="amount_asc">Amount ↑</option>
          </select>
        </label>
      </div>

      {showForm && (
        <div className="card" style={{marginBottom:12}}>
          <div className="card-header"><strong>Add income</strong></div>
          <div className="card-body" style={{display:'grid',gap:8}}>
            <label>Source: <input value={form.source} onChange={(e)=>setForm({...form,source:e.target.value})} placeholder="e.g., Salary" /></label>
            <label>Category: <input value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})} /></label>
            <label>Amount: <input type="number" value={form.amount} onChange={(e)=>setForm({...form,amount:Number(e.target.value)})} /></label>
            <label>Date: <input type="date" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})} /></label>
            <label>Account: <AccountSelector value={form.account_id} onChange={(val)=>setForm({...form,account_id:val})} /></label>
            <label>Recurrence:
              <select value={form.recurrence} onChange={(e)=>setForm({...form,recurrence:e.target.value})}>
                <option value="one-time">One-time</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>
            <label>Tags: <input value={form.tags} onChange={(e)=>setForm({...form,tags:e.target.value})} placeholder="comma separated" /></label>
            <label>Notes: <input value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} /></label>
            <div><button className="btn accent" onClick={add}>Save</button></div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><strong>Ledger</strong></div>
        <div className="card-body">
          <table className="table">
            <thead><tr><th>Source</th><th>Category</th><th className="right">Amount</th><th>Date</th><th>Tags</th><th>Notes</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(i => {
                const amt = Number((i.amount ?? i.inflow) || 0);
                return (
                  <tr key={i.id}>
                    <td>{i.source || i.label}</td>
                    <td>{i.category}</td>
                    <td className="right">{fmt(amt)}</td>
                    <td>{(i.date||'').slice(0,10)}</td>
                    <td>{i.tags}</td>
                    <td>{i.notes}</td>
                    <td>
                      <button className="btn" onClick={()=>{ setEdit(i); setError(''); }}>Edit</button>
                      <button className="btn danger" onClick={()=>remove(i.id)} style={{marginLeft:6}}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <SimpleModal open={!!edit} title="Edit Income" onClose={()=>setEdit(null)}>
        {error && <p style={{color:'salmon'}}>{error}</p>}
        {edit && (
          <div style={{display:'grid',gap:8}}>
            <label>Source: <input value={edit.source || edit.label} onChange={(e)=>setEdit({...edit,source:e.target.value})} /></label>
            <label>Category: <input value={edit.category || ''} onChange={(e)=>setEdit({...edit,category:e.target.value})} /></label>
            <label>Amount: <input type="number" value={(edit.amount ?? edit.inflow) || 0} onChange={(e)=>setEdit({...edit,amount:Number(e.target.value)})} /></label>
            <label>Date: <input type="date" value={edit.date?.slice(0,10)||''} onChange={(e)=>setEdit({...edit,date:e.target.value})} /></label>
            <label>Recurrence:
              <select value={edit.recurrence || 'one-time'} onChange={(e)=>setEdit({...edit,recurrence:e.target.value})}>
                <option value="one-time">One-time</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>
            <label>Tags: <input value={edit.tags || ''} onChange={(e)=>setEdit({...edit,tags:e.target.value})} /></label>
            <label>Notes: <input value={edit.notes || ''} onChange={(e)=>setEdit({...edit,notes:e.target.value})} /></label>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="btn accent" onClick={saveEdit}>Save</button>
              <button className="btn" onClick={()=>setEdit(null)}>Cancel</button>
            </div>
          </div>
        )}
      </SimpleModal>
    </FinanceLayout>
  );
}
