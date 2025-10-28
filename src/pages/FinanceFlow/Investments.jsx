import React, { useMemo } from 'react';
import FinanceLayout from '../../components/finance/FinanceLayout.jsx';
import { useEffect, useState } from 'react';
import { listInvestments, saveInvestment, deleteWithAudit } from '../../db/stores/financeStore';
import { calculateFD } from '../../utils/finance/financeCalc';
import SimpleModal from '../../components/common/SimpleModal';
import { useCurrencyFormatter, todayISO } from '../../utils/format';

export default function Investments() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type:'FD', institution:'', amount:0, rate:6.5, tenure_months:12, start_date: todayISO(), maturity_date:'', cashout_amount:0, cashout_date:'', status:'Active', notes:'' });
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ q:'', type:'', status:'', from:'', to:'', sort:'date_desc' });
  const fmt = useCurrencyFormatter();

  async function load() { setItems(await listInvestments()); }
  useEffect(()=>{ load(); }, []);

  async function add() {
    if (!form.institution || Number(form.amount) <= 0) { setError('Institution and positive amount are required'); return; }
    const payload = { ...form, interest_rate: form.rate, date: form.start_date };
    await saveInvestment(payload);
    setShowForm(false);
    setForm({ type:'FD', institution:'', amount:0, rate:6.5, tenure_months:12, start_date: todayISO(), maturity_date:'', cashout_amount:0, cashout_date:'', status:'Active', notes:'' });
    await load();
  }

  async function saveEdit(){
    if (!edit) return;
    if (!edit.institution || Number(edit.amount) <= 0) { setError('Institution and positive amount are required'); return; }
    const patch = { ...edit, interest_rate: edit.rate ?? edit.interest_rate };
    await saveInvestment(patch);
    setEdit(null);
    setError('');
    await load();
  }

  async function remove(id){ if(!window.confirm('Delete this investment?')) return; await deleteWithAudit('investments', id); await load(); }

  const filtered = useMemo(()=>{
    let arr = items.slice();
    if (filter.q) arr = arr.filter(i => ((i.institution||'')+' '+(i.type||'')).toLowerCase().includes(filter.q.toLowerCase()));
    if (filter.type) arr = arr.filter(i => (i.type||'') === filter.type);
    if (filter.status) arr = arr.filter(i => (i.status||'') === filter.status);
    const startDate = (i)=> i.start_date || i.date;
    if (filter.from) arr = arr.filter(i => (startDate(i)||'') >= filter.from);
    if (filter.to) arr = arr.filter(i => (startDate(i)||'') <= filter.to);
    if (filter.sort === 'amount_desc') arr.sort((a,b)=> (Number(b.amount||0) - Number(a.amount||0)));
    else if (filter.sort === 'amount_asc') arr.sort((a,b)=> (Number(a.amount||0) - Number(b.amount||0)));
    else if (filter.sort === 'date_asc') arr.sort((a,b)=> String(a.date||'').localeCompare(String(b.date||'')));
    else arr.sort((a,b)=> String(b.date||'').localeCompare(String(a.date||'')));
    return arr;
  }, [items, filter]);

  return (
    <FinanceLayout title="Investments">
      <div className="toolbar" style={{marginBottom:12}}>
        <button className="btn primary" onClick={()=>setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add investment'}</button>
        <input type="search" placeholder="Search type/institution" value={filter.q} onChange={(e)=>setFilter({...filter,q:e.target.value})} />
        <label>Type:
          <select value={filter.type} onChange={(e)=>setFilter({...filter,type:e.target.value})}>
            <option value="">All</option>
            <option value="FD">FD</option>
            <option value="SIP">SIP</option>
            <option value="Stock">Stock</option>
          </select>
        </label>
        <label>Status:
          <select value={filter.status} onChange={(e)=>setFilter({...filter,status:e.target.value})}>
            <option value="">All</option>
            <option value="Active">Active</option>
            <option value="Matured">Matured</option>
            <option value="Closed">Closed</option>
          </select>
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
          <div className="card-header"><strong>Add investment</strong></div>
          <div className="card-body" style={{display:'grid',gap:8}}>
            <label>Type: 
              <select value={form.type} onChange={(e)=>setForm({...form,type:e.target.value})}>
                <option value="FD">FD</option>
                <option value="General">General</option>
                <option value="SIP">SIP</option>
                <option value="Stock">Stock</option>
              </select>
            </label>
            <label>Institution: <input value={form.institution} onChange={(e)=>setForm({...form,institution:e.target.value})} /></label>
            <label>Amount: <input type="number" value={form.amount} onChange={(e)=>setForm({...form,amount: Number(e.target.value)})} /></label>
            {String(form.type).toUpperCase() === 'FD' ? (
              <>
                <label>Rate %: <input type="number" step="0.01" value={form.rate} onChange={(e)=>setForm({...form,rate: Number(e.target.value)})} /></label>
                <label>Tenure months: <input type="number" value={form.tenure_months} onChange={(e)=>setForm({...form,tenure_months: Number(e.target.value)})} /></label>
                <label>Maturity date (optional): <input type="date" value={form.maturity_date} onChange={(e)=>setForm({...form,maturity_date:e.target.value})} /></label>
              </>
            ) : (
              <>
                <label>Cashout amount: <input type="number" value={form.cashout_amount} onChange={(e)=>setForm({...form,cashout_amount: Number(e.target.value)})} placeholder="when realized" /></label>
                <label>Cashout date: <input type="date" value={form.cashout_date} onChange={(e)=>setForm({...form,cashout_date:e.target.value})} /></label>
              </>
            )}
            <label>Start date: <input type="date" value={form.start_date} onChange={(e)=>setForm({...form,start_date:e.target.value})} /></label>
            <label>Status:
              <select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})}>
                <option>Active</option>
                <option>Matured</option>
                <option>Closed</option>
              </select>
            </label>
            <label>Notes: <input value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} /></label>
            <div><button className="btn accent" onClick={add}>Save</button></div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><strong>Ledger</strong></div>
        <div className="card-body">
          <table className="table">
            <thead>
              <tr><th>Type</th><th>Institution</th><th className="right">Amount</th><th>Interest</th><th>Tenure</th><th className="right">Maturity</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(i=>{
                const rate = Number((i.rate ?? i.interest_rate) || 0);
                const isFD = String(i.type||'').toUpperCase() === 'FD';
                const c = isFD ? calculateFD({ amount: Number(i.amount||0), interest_rate: rate, tenure_months: Number(i.tenure_months||0) }) : { maturity_value: Number(i.cashout_amount||0) || 0, interest_earned: Math.max(0, (Number(i.cashout_amount||0)||0) - (Number(i.amount||0)||0)) };
                return (
                  <tr key={i.id}>
                    <td>{i.type}</td>
                    <td>{i.institution}</td>
                    <td className="right">{fmt(i.amount)}</td>
                    <td>{isFD ? `${rate}%` : '—'}</td>
                    <td>{isFD ? `${i.tenure_months}m` : '—'}</td>
                    <td className="right">{c.maturity_value ? fmt(c.maturity_value) : '—'} {isFD ? (<span className="muted">(earned {fmt(c.interest_earned)})</span>) : (i.cashout_amount ? <span className="muted">(realized {fmt(c.interest_earned)})</span> : <span className="muted">(set cashout to realize)</span>)}</td>
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

      <SimpleModal open={!!edit} title="Edit Investment" onClose={()=>setEdit(null)}>
        {error && <p style={{color:'salmon'}}>{error}</p>}
        {edit && (
          <div style={{display:'grid',gap:8}}>
            <label>Type: 
              <select value={edit.type} onChange={(e)=>setEdit({...edit,type:e.target.value})}>
                <option value="FD">FD</option>
                <option value="General">General</option>
                <option value="SIP">SIP</option>
                <option value="Stock">Stock</option>
              </select>
            </label>
            <label>Institution: <input value={edit.institution} onChange={(e)=>setEdit({...edit,institution:e.target.value})} /></label>
            <label>Amount: <input type="number" value={edit.amount} onChange={(e)=>setEdit({...edit,amount:Number(e.target.value)})} /></label>
            {String(edit.type).toUpperCase() === 'FD' ? (
              <>
                <label>Rate %: <input type="number" step="0.01" value={edit.rate ?? edit.interest_rate} onChange={(e)=>setEdit({...edit,rate:Number(e.target.value)})} /></label>
                <label>Tenure months: <input type="number" value={edit.tenure_months} onChange={(e)=>setEdit({...edit,tenure_months:Number(e.target.value)})} /></label>
                <label>Maturity date: <input type="date" value={(edit.maturity_date || '').slice(0,10)} onChange={(e)=>setEdit({...edit,maturity_date:e.target.value})} /></label>
              </>
            ) : (
              <>
                <label>Cashout amount: <input type="number" value={edit.cashout_amount || 0} onChange={(e)=>setEdit({...edit,cashout_amount:Number(e.target.value)})} /></label>
                <label>Cashout date: <input type="date" value={(edit.cashout_date || '').slice(0,10)} onChange={(e)=>setEdit({...edit,cashout_date:e.target.value})} /></label>
              </>
            )}
            <label>Start date: <input type="date" value={(edit.start_date || edit.date || '').slice(0,10)} onChange={(e)=>setEdit({...edit,start_date:e.target.value})} /></label>
            <label>Status:
              <select value={edit.status || 'Active'} onChange={(e)=>setEdit({...edit,status:e.target.value})}>
                <option>Active</option>
                <option>Matured</option>
                <option>Closed</option>
              </select>
            </label>
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
