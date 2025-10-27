import React from 'react';
import FinanceNav from '../../components/finance/FinanceNav';
import { useEffect, useState } from 'react';
import { listInvestments, saveInvestment, deleteInvestment } from '../../db/financeStore';
import { calculateFD } from '../../utils/financeCalc';
import SimpleModal from '../../components/common/SimpleModal';

export default function Investments() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type:'FD', institution:'', amount:0, interest_rate:6.5, tenure_months:12, start_date: new Date().toISOString() });
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState('');

  async function load() { setItems(await listInvestments()); }
  useEffect(()=>{ load(); }, []);

  async function add() {
    if (!form.institution || Number(form.amount) <= 0) { setError('Institution and positive amount are required'); return; }
    await saveInvestment(form);
    setShowForm(false);
    setForm({ type:'FD', institution:'', amount:0, interest_rate:6.5, tenure_months:12, start_date: new Date().toISOString() });
    await load();
  }

  async function saveEdit(){
    if (!edit) return;
    if (!edit.institution || Number(edit.amount) <= 0) { setError('Institution and positive amount are required'); return; }
    await saveInvestment(edit);
    setEdit(null);
    setError('');
    await load();
  }

  async function remove(id){ await deleteInvestment(id); await load(); }

  return (
    <div className="page finance-investments">
      <FinanceNav />
      <h1>Investments</h1>
      <p>Ledger table for FDs, SIPs, Stocks.</p>
      <div style={{marginBottom:12}}>
        <button onClick={()=>setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add investment'}</button>
      </div>
      {showForm && (
        <div style={{border:'1px solid rgba(255,255,255,0.06)',padding:8,borderRadius:6,marginBottom:12}}>
          <label>Type: <input value={form.type} onChange={(e)=>setForm({...form,type:e.target.value})} /></label>
          <label>Institution: <input value={form.institution} onChange={(e)=>setForm({...form,institution:e.target.value})} /></label>
          <label>Amount: <input type="number" value={form.amount} onChange={(e)=>setForm({...form,amount: Number(e.target.value)})} /></label>
          <label>Interest %: <input type="number" step="0.01" value={form.interest_rate} onChange={(e)=>setForm({...form,interest_rate: Number(e.target.value)})} /></label>
          <label>Tenure months: <input type="number" value={form.tenure_months} onChange={(e)=>setForm({...form,tenure_months: Number(e.target.value)})} /></label>
          <div style={{marginTop:8}}><button onClick={add}>Save</button></div>
        </div>
      )}

      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead>
          <tr><th>Type</th><th>Institution</th><th>Amount</th><th>Interest</th><th>Tenure</th><th>Maturity</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {items.map(i=>{
            const c = calculateFD({ amount: Number(i.amount||0), interest_rate: Number(i.interest_rate||0), tenure_months: Number(i.tenure_months||0) });
            return (
              <tr key={i.id}>
                <td>{i.type}</td>
                <td>{i.institution}</td>
                <td>{i.amount}</td>
                <td>{i.interest_rate}%</td>
                <td>{i.tenure_months}m</td>
                <td>{c.maturity_value} (earned {c.interest_earned})</td>
                <td>
                  <button onClick={()=>{ setEdit(i); setError(''); }}>Edit</button>
                  <button onClick={()=>remove(i.id)} style={{marginLeft:6}}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <SimpleModal open={!!edit} title="Edit Investment" onClose={()=>setEdit(null)}>
        {error && <p style={{color:'salmon'}}>{error}</p>}
        {edit && (
          <div style={{display:'grid',gap:8}}>
            <label>Type: <input value={edit.type} onChange={(e)=>setEdit({...edit,type:e.target.value})} /></label>
            <label>Institution: <input value={edit.institution} onChange={(e)=>setEdit({...edit,institution:e.target.value})} /></label>
            <label>Amount: <input type="number" value={edit.amount} onChange={(e)=>setEdit({...edit,amount:Number(e.target.value)})} /></label>
            <label>Interest %: <input type="number" step="0.01" value={edit.interest_rate} onChange={(e)=>setEdit({...edit,interest_rate:Number(e.target.value)})} /></label>
            <label>Tenure months: <input type="number" value={edit.tenure_months} onChange={(e)=>setEdit({...edit,tenure_months:Number(e.target.value)})} /></label>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button onClick={saveEdit}>Save</button>
              <button onClick={()=>setEdit(null)}>Cancel</button>
            </div>
          </div>
        )}
      </SimpleModal>
    </div>
  );
}
