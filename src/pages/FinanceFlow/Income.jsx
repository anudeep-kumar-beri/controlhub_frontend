import React, { useEffect, useState } from 'react';
import FinanceNav from '../../components/finance/FinanceNav';
import { listIncome, saveIncome, deleteIncome } from '../../db/financeStore';
import SimpleModal from '../../components/common/SimpleModal';

export default function Income() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label:'', inflow:0, date:new Date().toISOString() });
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState('');

  async function load(){ setItems(await listIncome()); }
  useEffect(()=>{ load(); }, []);

  async function add(){ if(!form.label || Number(form.inflow)<=0){ setError('Label and positive amount required'); return;} await saveIncome(form); setShowForm(false); setForm({ label:'', inflow:0, date:new Date().toISOString() }); setError(''); await load(); }
  async function saveEdit(){ if(!edit.label || Number(edit.inflow)<=0){ setError('Label and positive amount required'); return;} await saveIncome(edit); setEdit(null); setError(''); await load(); }
  async function remove(id){ await deleteIncome(id); await load(); }

  return (
    <div className="page finance-income">
      <FinanceNav />
      <h1>Income</h1>
      <p>Income ledger.</p>
      <div style={{marginBottom:12}}>
        <button onClick={()=>setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add income'}</button>
      </div>
      {showForm && (
        <div style={{padding:8,border:'1px solid rgba(255,255,255,0.06)',borderRadius:6}}>
          <label>Label: <input value={form.label} onChange={(e)=>setForm({...form,label:e.target.value})} /></label>
          <label>Amount: <input type="number" value={form.inflow} onChange={(e)=>setForm({...form,inflow:Number(e.target.value)})} /></label>
          <div style={{marginTop:8}}><button onClick={add}>Save</button></div>
        </div>
      )}

      <table style={{width:'100%'}}>
        <thead><tr><th>Label</th><th>Amount</th><th>Actions</th></tr></thead>
        <tbody>
          {items.map(i => (
            <tr key={i.id}>
              <td>{i.label}</td>
              <td>{i.inflow}</td>
              <td>
                <button onClick={()=>{ setEdit(i); setError(''); }}>Edit</button>
                <button onClick={()=>remove(i.id)} style={{marginLeft:6}}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <SimpleModal open={!!edit} title="Edit Income" onClose={()=>setEdit(null)}>
        {error && <p style={{color:'salmon'}}>{error}</p>}
        {edit && (
          <div style={{display:'grid',gap:8}}>
            <label>Label: <input value={edit.label} onChange={(e)=>setEdit({...edit,label:e.target.value})} /></label>
            <label>Amount: <input type="number" value={edit.inflow} onChange={(e)=>setEdit({...edit,inflow:Number(e.target.value)})} /></label>
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
