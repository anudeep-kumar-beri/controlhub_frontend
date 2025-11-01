import React, { useEffect, useMemo, useState } from 'react';
import FinanceLayout from '../../components/finance/FinanceLayout.jsx';
import { listExpenses, saveExpense, deleteWithAudit } from '../../db/stores/financeStore';
import SimpleModal from '../../components/common/SimpleModal';
import { useCurrencyFormatter, todayISO } from '../../utils/format';
import AccountSelector from '../../components/finance/AccountSelector.jsx';

export default function Expenses() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', category:'General', amount:0, date: todayISO(), recurrence:'one-time', tags:'', notes:'', account_id: null });
  const [quick, setQuick] = useState({ title:'', amount:'' });
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ q:'', category:'', from:'', to:'', sort:'date_desc' });
  const fmt = useCurrencyFormatter();

  async function load(){ setItems(await listExpenses()); }
  useEffect(()=>{ load(); }, []);

  async function add(){ if(!form.title || Number(form.amount)<=0){ setError('Title and positive amount required'); return;} await saveExpense({ ...form, outflow: form.amount, label: form.title }); setShowForm(false); setForm({ title:'', category:'General', amount:0, date: todayISO(), recurrence:'one-time', tags:'', notes:'', account_id: null }); setError(''); await load(); }
  async function saveEdit(){ if((!edit.title && !edit.label) || Number((edit.amount ?? edit.outflow) || 0)<=0){ setError('Title and positive amount required'); return;} const toSave = { ...edit, amount: Number((edit.amount ?? edit.outflow) || 0), outflow: Number((edit.amount ?? edit.outflow) || 0), label: edit.title || edit.label }; await saveExpense(toSave); setEdit(null); setError(''); await load(); }
  async function remove(id){ if(!window.confirm('Delete this expense?')) return; await deleteWithAudit('expenses', id); await load(); }
  async function quickAdd(){ if(!quick.title || !quick.amount) return; const amt = Number(quick.amount); if(isNaN(amt) || amt<=0) return; await saveExpense({ title: quick.title, label: quick.title, amount: amt, outflow: amt, date: todayISO(), category:'Quick', recurrence:'one-time' }); setQuick({ title:'', amount:''}); await load(); }

  const filtered = useMemo(()=>{
    let arr = items.slice();
    if (filter.q) arr = arr.filter(i => ((i.title||i.label||'')+(i.tags?' '+i.tags:'' )).toLowerCase().includes(filter.q.toLowerCase()));
    if (filter.category) arr = arr.filter(i => (i.category||'') === filter.category);
    // Normalize dates to YYYY-MM-DD format for comparison
    if (filter.from) arr = arr.filter(i => String(i.date||'').slice(0,10) >= filter.from);
    if (filter.to) arr = arr.filter(i => String(i.date||'').slice(0,10) <= filter.to);
    const amt = (x)=> Number((x.amount ?? x.outflow) || 0);
    if (filter.sort === 'amount_desc') arr.sort((a,b)=> (amt(b) - amt(a)));
    else if (filter.sort === 'amount_asc') arr.sort((a,b)=> (amt(a) - amt(b)));
    else if (filter.sort === 'date_asc') arr.sort((a,b)=> String(a.date||'').localeCompare(String(b.date||'')));
    else arr.sort((a,b)=> String(b.date||'').localeCompare(String(a.date||'')));
    return arr;
  }, [items, filter]);

  return (
    <FinanceLayout title="Expenses">
      <div className="toolbar" style={{marginBottom:12}}>
        <button className="btn primary" onClick={()=>setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add expense'}</button>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <input type="text" placeholder="Quick title" value={quick.title} onChange={(e)=>setQuick({...quick,title:e.target.value})} />
          <input type="number" placeholder="Amount" value={quick.amount} onChange={(e)=>setQuick({...quick,amount:e.target.value})} />
          <button className="btn accent" onClick={quickAdd}>Quick Add</button>
        </div>
        <input type="search" placeholder="Search title/tags" value={filter.q} onChange={(e)=>setFilter({...filter,q:e.target.value})} />
        <label>Category:
          <input value={filter.category} onChange={(e)=>setFilter({...filter,category:e.target.value})} placeholder="e.g., Food" />
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
          <div className="card-header"><strong>Add expense</strong></div>
          <div className="card-body" style={{display:'grid',gap:8}}>
            <label>Title: <input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} /></label>
            <label>Category: <input value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})} /></label>
            <label>Amount: <input type="number" value={form.amount} onChange={(e)=>setForm({...form,amount:Number(e.target.value)})} /></label>
            <label>Date: <input type="date" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})} /></label>
            <label>Account: <AccountSelector value={form.account_id} onChange={(val)=>setForm({...form,account_id:val})} /></label>
            <label>Recurrence:
              <select value={form.recurrence} onChange={(e)=>setForm({...form,recurrence:e.target.value})}>
                <option value="one-time">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
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
            <thead><tr><th>Title</th><th>Category</th><th className="right">Amount</th><th>Date</th><th>Tags</th><th>Notes</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(i => {
                const amt = Number((i.amount ?? i.outflow) || 0);
                return (
                  <tr key={i.id}>
                    <td>{i.title || i.label}</td>
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

      <SimpleModal open={!!edit} title="Edit Expense" onClose={()=>setEdit(null)}>
        {error && <p style={{color:'salmon'}}>{error}</p>}
        {edit && (
          <div style={{display:'grid',gap:8}}>
            <label>Title: <input value={edit.title || edit.label} onChange={(e)=>setEdit({...edit,title:e.target.value})} /></label>
            <label>Category: <input value={edit.category || ''} onChange={(e)=>setEdit({...edit,category:e.target.value})} /></label>
            <label>Amount: <input type="number" value={(edit.amount ?? edit.outflow) || 0} onChange={(e)=>setEdit({...edit,amount:Number(e.target.value)})} /></label>
            <label>Date: <input type="date" value={edit.date?.slice(0,10)||''} onChange={(e)=>setEdit({...edit,date:e.target.value})} /></label>
            <label>Recurrence:
              <select value={edit.recurrence || 'one-time'} onChange={(e)=>setEdit({...edit,recurrence:e.target.value})}>
                <option value="one-time">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
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
