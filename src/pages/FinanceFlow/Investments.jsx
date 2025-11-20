import React, { useMemo } from 'react';
import FinanceLayout from '../../components/finance/FinanceLayout.jsx';
import { useEffect, useState } from 'react';
import { listInvestments, saveInvestment, deleteWithAudit, patchRecord, listAccounts } from '../../db/stores/financeStore';
import { calculateFD } from '../../utils/finance/financeCalc';
import { computePortfolio, computeMaturityInfo, computePaperValue, addMonths } from '../../utils/finance/investmentMetrics';
import SimpleModal from '../../components/common/SimpleModal';
import { useCurrencyFormatter, todayISO } from '../../utils/format';
import AccountSelector from '../../components/finance/AccountSelector.jsx';

export default function Investments() {
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type:'FD', institution:'', amount:0,
    units:0, unit_cost:0, current_unit_price:0,
    rate:6.5, compounding:1, tenure_months:12,
    start_date: todayISO(), maturity_date:'',
    cashout_amount:0, cashout_date:'', status:'Created',
    notes:'', account_id: null, payout_account_id: null, status_history: []
  });
  const [edit, setEdit] = useState(null);
  // Action modal state (cash out / stash / mature)
  const [actionInv, setActionInv] = useState(null); // investment in modal
  const [actionMode, setActionMode] = useState(null); // 'cashout' | 'stash' | 'mature'
  const [actionForm, setActionForm] = useState({ amount: 0, date: todayISO(), account_id: null, notes: '' });
  // Inline account assignment state
  const [inlineAssign, setInlineAssign] = useState(null); // { id, mode: 'debit'|'credit' }
  const [assignAccountId, setAssignAccountId] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ q:'', type:'', status:'', from:'', to:'', sort:'date_desc' });
  const fmt = useCurrencyFormatter();

  async function load() {
    setItems(await listInvestments());
    setAccounts(await listAccounts());
  }
  useEffect(()=>{ load(); }, []);

  function pushStatusHistory(record, newStatus, date) {
    const hist = Array.isArray(record.status_history) ? record.status_history.slice() : [];
    hist.push({ status: newStatus, date: date || todayISO() });
    return hist;
  }

  async function add() {
    if (!form.institution || Number(form.amount) <= 0) { setError('Institution and positive amount are required'); return; }
    if (!form.account_id) { setError('Source (debit) account is required'); return; }
    const payload = { ...form, interest_rate: form.rate, date: form.start_date };
    payload.status_history = pushStatusHistory(payload, 'Created', payload.start_date);
    // Derive amount if units + unit_cost provided and amount empty
    if (payload.amount === 0 && payload.units > 0 && payload.unit_cost > 0) {
      payload.amount = payload.units * payload.unit_cost;
    }
    await saveInvestment(payload);
    setShowForm(false);
    setForm({
      type:'FD', institution:'', amount:0, units:0, unit_cost:0, current_unit_price:0,
      rate:6.5, compounding:1, tenure_months:12, start_date: todayISO(), maturity_date:'',
      cashout_amount:0, cashout_date:'', status:'Created', notes:'', account_id: null, payout_account_id: null, status_history: []
    });
    await load();
  }

  async function saveEdit(){
    if (!edit) return;
    if (!edit.institution || Number(edit.amount) <= 0) { setError('Institution and positive amount are required'); return; }
    if (!edit.account_id) { setError('Source (debit) account required'); return; }
    const patch = { ...edit, interest_rate: edit.rate ?? edit.interest_rate };
    // Recalculate amount if units provided and unit_cost changed
    if (patch.units > 0 && patch.unit_cost > 0 && (patch.type || '').match(/MF|STOCK|CRYPTO|GOLD/i)) {
      patch.amount = patch.units * patch.unit_cost;
    }
    await saveInvestment(patch);
    setEdit(null);
    setError('');
    await load();
  }

  async function remove(id){ if(!window.confirm('Delete this investment?')) return; await deleteWithAudit('investments', id); await load(); }

  function openAction(inv, mode) {
    const isFD = String(inv.type||'').toUpperCase() === 'FD';
    let defaultAmount = Number(inv.cashout_amount || 0) || 0;
    if (isFD && mode === 'mature') {
      const rate = Number((inv.rate ?? inv.interest_rate) || 0);
      const calc = calculateFD({ amount: Number(inv.amount||0), interest_rate: rate, tenure_months: Number(inv.tenure_months||0), compounding: Number(inv.compounding||1) });
      defaultAmount = calc.maturity_value || Number(inv.amount||0);
    } else if (mode === 'cashout') {
      // Default to paper value if units + current_unit_price
      if (inv.units > 0 && inv.current_unit_price > 0) {
        defaultAmount = inv.units * inv.current_unit_price;
      }
    }
    setActionInv(inv);
    setActionMode(mode);
    setActionForm({ amount: defaultAmount, date: todayISO(), account_id: inv.payout_account_id || inv.account_id || null, notes: inv.notes || '' });
  }

  async function confirmAction() {
    if (!actionInv) return;
    const patch = { ...actionInv };
    const amountNum = Number(actionForm.amount || 0);
    const dateStr = actionForm.date;
    const accId = actionForm.account_id || null;
    if (actionMode === 'mature') {
      patch.cashout_amount = amountNum; // treat as final maturity inflow
      patch.cashout_date = dateStr;
      patch.payout_account_id = accId;
      patch.status = 'Matured';
      if (!patch.maturity_date) patch.maturity_date = dateStr;
      patch.status_history = pushStatusHistory(patch, 'Matured', dateStr);
    } else if (actionMode === 'cashout') {
      patch.cashout_amount = amountNum;
      patch.cashout_date = dateStr;
      patch.payout_account_id = accId;
      patch.status = 'CashedOut';
      patch.status_history = pushStatusHistory(patch, 'CashedOut', dateStr);
    } else if (actionMode === 'stash') {
      // Stash: move to another account without realizing gains; just change payout or holding account
      patch.payout_account_id = accId; // designate future payout
      patch.status = 'Stashed';
      patch.status_history = pushStatusHistory(patch, 'Stashed', dateStr);
    }
    patch.notes = actionForm.notes || patch.notes || '';
    await saveInvestment(patch);
    setActionInv(null); setActionMode(null);
    await load();
  }

  // Derived portfolio metrics via utility (pure for tests)
  const portfolio = useMemo(()=> computePortfolio(items, todayISO()), [items]);

  // Background price updater (random drift) for unit assets (optional feature)
  useEffect(()=>{
    const interval = setInterval(async ()=>{
      const unitAssets = items.filter(i => ['MF','STOCK','CRYPTO','GOLD'].includes(String(i.type||'').toUpperCase()) && (i.units>0) && (i.current_unit_price > 0 || i.unit_cost > 0));
      if (!unitAssets.length) return;
      for (const inv of unitAssets) {
        const base = Number(inv.current_unit_price || inv.unit_cost || 0);
        if (!base) continue;
        const drift = 1 + ((Math.random()-0.5) * 0.01); // +/-0.5%
        const newPrice = Math.max(0, Math.round(base * drift * 10000)/10000);
        await patchRecord('investments', inv.id, { current_unit_price: newPrice });
      }
      await load();
    }, 60000); // 60s
    return ()=> clearInterval(interval);
  }, [items]);

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

  // Inline account assign confirmation
  async function confirmInlineAssign() {
    if (!inlineAssign || !assignAccountId) { setInlineAssign(null); return; }
    const patch = inlineAssign.mode === 'debit' ? { account_id: assignAccountId } : { payout_account_id: assignAccountId };
    await patchRecord('investments', inlineAssign.id, patch);
    setInlineAssign(null);
    setAssignAccountId(null);
    await load();
  }

  return (
    <FinanceLayout title="Investments">
      {/* Portfolio summary */}
      <div className="card" style={{marginBottom:12}}>
        <div className="card-header"><strong>Portfolio Snapshot</strong></div>
        <div className="card-body" style={{display:'grid', gap:8}}>
          <div style={{display:'flex', flexWrap:'wrap', gap:12}}>
            {portfolio.allocation.map(a=> (
              <div key={a.type} style={{padding:6, background:'#f6f6f9', borderRadius:4, minWidth:140}}>
                <strong>{a.type}</strong><br/>
                {fmt(a.value)} <span className="muted">({a.pct.toFixed(1)}%)</span>
              </div>
            ))}
          </div>
          <div style={{display:'flex', gap:24, flexWrap:'wrap'}}>
            <div><strong>Total Principal:</strong> {fmt(portfolio.totalPrincipal)}</div>
            <div><strong>Realized P&amp;L:</strong> <span style={{color: portfolio.realizedPL>=0?'green':'salmon'}}>{fmt(portfolio.realizedPL)}</span></div>
            <div><strong>Unrealized P&amp;L:</strong> <span style={{color: portfolio.unrealizedPL>=0?'green':'salmon'}}>{fmt(portfolio.unrealizedPL)}</span></div>
          </div>
          <div style={{display:'flex', gap:16, flexWrap:'wrap'}}>
            <div><strong>Upcoming (30d):</strong> {portfolio.upcoming.d30.length}</div>
            <div><strong>60d:</strong> {portfolio.upcoming.d60.length}</div>
            <div><strong>90d:</strong> {portfolio.upcoming.d90.length}</div>
          </div>
        </div>
      </div>
      <div className="toolbar" style={{marginBottom:12}}>
        <button className="btn primary" onClick={()=>setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add investment'}</button>
        <input type="search" placeholder="Search type/institution" value={filter.q} onChange={(e)=>setFilter({...filter,q:e.target.value})} />
        <label>Type:
          <select value={filter.type} onChange={(e)=>setFilter({...filter,type:e.target.value})}>
            <option value="">All</option>
            <option value="FD">FD</option>
            <option value="RD">RD</option>
            <option value="BOND">BOND</option>
            <option value="MF">MF</option>
            <option value="GOLD">GOLD</option>
            <option value="CRYPTO">CRYPTO</option>
            <option value="OTHER">OTHER</option>
          </select>
        </label>
        <label>Status:
          <select value={filter.status} onChange={(e)=>setFilter({...filter,status:e.target.value})}>
            <option value="">All</option>
            <option value="Created">Created</option>
            <option value="Running">Running</option>
            <option value="Stashed">Stashed</option>
            <option value="Matured">Matured</option>
            <option value="CashedOut">CashedOut</option>
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
                <option value="RD">RD</option>
                <option value="BOND">BOND</option>
                <option value="MF">MF</option>
                <option value="GOLD">GOLD</option>
                <option value="CRYPTO">CRYPTO</option>
                <option value="OTHER">OTHER</option>
              </select>
            </label>
            <label>Institution: <input value={form.institution} onChange={(e)=>setForm({...form,institution:e.target.value})} /></label>
            {(['MF','STOCK','CRYPTO','GOLD'].includes(String(form.type).toUpperCase())) && (
              <>
                <label>Units: <input type="number" value={form.units} onChange={(e)=>setForm({...form,units:Number(e.target.value)})} /></label>
                <label>Unit cost at purchase: <input type="number" step="0.0001" value={form.unit_cost} onChange={(e)=>setForm({...form,unit_cost:Number(e.target.value)})} /></label>
                <label>Current unit price (optional): <input type="number" step="0.0001" value={form.current_unit_price} onChange={(e)=>setForm({...form,current_unit_price:Number(e.target.value)})} /></label>
              </>
            )}
            <label>Amount (principal): <input type="number" value={form.amount} onChange={(e)=>setForm({...form,amount: Number(e.target.value)})} placeholder="auto from units × cost if 0" /></label>
            {(['FD','RD','BOND'].includes(String(form.type).toUpperCase())) && (
              <>
                <label>Rate %: <input type="number" step="0.01" value={form.rate} onChange={(e)=>setForm({...form,rate: Number(e.target.value)})} /></label>
                <label>Compounding per year:
                  <select value={form.compounding} onChange={(e)=>setForm({...form,compounding:Number(e.target.value)})}>
                    <option value={1}>Annual</option>
                    <option value={4}>Quarterly</option>
                    <option value={12}>Monthly</option>
                  </select>
                </label>
                <label>Tenure (months): <input type="number" value={form.tenure_months} onChange={(e)=>setForm({...form,tenure_months: Number(e.target.value)})} /></label>
                <label>Maturity date (optional): <input type="date" value={form.maturity_date} onChange={(e)=>setForm({...form,maturity_date:e.target.value})} /></label>
              </>
            )}
            <label>Start date: <input type="date" value={form.start_date} onChange={(e)=>setForm({...form,start_date:e.target.value})} /></label>
            <label>Source (debit) Account: <AccountSelector value={form.account_id} onChange={(val)=>setForm({...form,account_id:val})} /></label>
            <label>Default Payout (credit) Account (optional): <AccountSelector value={form.payout_account_id} onChange={(val)=>setForm({...form,payout_account_id:val})} /></label>
            <label>Status:
              <select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})}>
                <option value="Created">Created</option>
                <option value="Running">Running</option>
                <option value="Stashed">Stashed</option>
                <option value="Matured">Matured</option>
                <option value="CashedOut">CashedOut</option>
                <option value="Closed">Closed</option>
              </select>
            </label>
            <label>Notes: <input value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} /></label>
            {error && <div style={{color:'salmon'}}>{error}</div>}
            <div><button className="btn accent" onClick={add}>Save</button></div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><strong>Ledger</strong></div>
        <div className="card-body">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th><th>Institution</th><th className="right">Principal</th><th>Derived / P&amp;L</th><th>Tenure</th><th>Maturity / Cashout</th><th>Lifecycle</th><th>Accounts</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i=>{
                const type = String(i.type||'').toUpperCase();
                const rate = Number((i.rate ?? i.interest_rate) || 0);
                const isFD = type === 'FD' || type === 'RD' || type === 'BOND';
                const tenureMonths = Number(i.tenure_months || i.tenure || 0);
                const fdCalc = isFD ? computeMaturityInfo(i) : null;
                let paperValue = null; let paperPL = null;
                if (!isFD && i.units > 0 && i.current_unit_price > 0) {
                  paperValue = i.units * i.current_unit_price;
                  paperPL = paperValue - Number(i.amount||0);
                }
                const maturityValue = isFD ? fdCalc.maturityValue : (i.cashout_amount || paperValue || 0);
                const interestEarned = isFD ? fdCalc.interestEarned : (paperPL !== null ? paperPL : Math.max(0, (Number(i.cashout_amount||0)||0) - (Number(i.amount||0)||0)));
                const startDate = (i.start_date || i.date || '').slice(0,10);
                const maturity = (i.maturity_date && String(i.maturity_date).slice(0,10)) || (isFD && startDate && tenureMonths ? addMonths(startDate, tenureMonths) : (i.cashout_date||''));
                const debitAcc = accounts.find(a=>a.id===i.account_id);
                const creditAcc = accounts.find(a=>a.id === (i.payout_account_id || i.account_id));
                const missingDebit = !i.account_id;
                const needsCredit = (['Matured','CashedOut'].includes(i.status)) && !i.payout_account_id;
                const history = Array.isArray(i.status_history)? i.status_history : [];
                const timeline = history.map(h=>h.status).join(' → ');
                return (
                  <tr key={i.id} className={(missingDebit||needsCredit)?'warn-row':''}>
                    <td>{i.type}</td>
                    <td>{i.institution}</td>
                    <td className="right">{fmt(i.amount)}</td>
                    <td>{isFD ? `${rate}% → ${fmt(maturityValue)}` : (paperValue ? `${fmt(paperValue)} (${paperPL>=0?'+':''}${fmt(paperPL)})` : '—')}</td>
                    <td>{isFD ? `${tenureMonths||'-'}m` : '—'}</td>
                    <td>{maturity ? maturity : '—'}<br/>{isFD ? (<span className="muted">Interest {fmt(interestEarned)}</span>) : (paperPL !== null ? <span className="muted">Paper P&amp;L {paperPL>=0?'+':''}{fmt(paperPL)}</span> : (i.cashout_amount ? <span className="muted">Realized {fmt(interestEarned)}</span> : <span className="muted">Pending</span>))}</td>
                    <td style={{maxWidth:160}}>
                      <div style={{fontSize:12}}>{timeline || i.status}</div>
                    </td>
                    <td>
                      <div style={{display:'flex',flexDirection:'column',gap:4}}>
                        <span className="badge" style={{background:'#ffe7e7'}}>
                          Debit: {debitAcc? debitAcc.name : 'Unassigned'}
                        </span>
                        <span className="badge" style={{background:'#e7f7ff'}}>
                          Credit: {creditAcc? creditAcc.name : 'Unset'}
                        </span>
                        {missingDebit && <span style={{color:'salmon',fontSize:12}}>Missing source <button className="btn small" onClick={()=>{setInlineAssign({id:i.id,mode:'debit'}); setAssignAccountId(null);}}>Assign</button></span>}
                        {needsCredit && <span style={{color:'orange',fontSize:12}}>Add payout <button className="btn small" onClick={()=>{setInlineAssign({id:i.id,mode:'credit'}); setAssignAccountId(null);}}>Assign</button></span>}
                      </div>
                    </td>
                    <td style={{minWidth:220}}>
                      <button className="btn" onClick={()=>{ setEdit(i); setError(''); }}>Edit</button>
                      {isFD ? (
                        <button className="btn" style={{marginLeft:6}} onClick={()=>openAction(i,'mature')}>Mature</button>
                      ) : (
                        <>
                          <button className="btn" style={{marginLeft:6}} onClick={()=>openAction(i,'cashout')}>Cash Out</button>
                          <button className="btn" style={{marginLeft:6}} onClick={()=>openAction(i,'stash')}>Stash</button>
                        </>
                      )}
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
                <option value="RD">RD</option>
                <option value="BOND">BOND</option>
                <option value="MF">MF</option>
                <option value="GOLD">GOLD</option>
                <option value="CRYPTO">CRYPTO</option>
                <option value="OTHER">OTHER</option>
              </select>
            </label>
            <label>Institution: <input value={edit.institution} onChange={(e)=>setEdit({...edit,institution:e.target.value})} /></label>
            {(['MF','STOCK','CRYPTO','GOLD'].includes(String(edit.type).toUpperCase())) && (
              <>
                <label>Units: <input type="number" value={edit.units||0} onChange={(e)=>setEdit({...edit,units:Number(e.target.value)})} /></label>
                <label>Unit cost: <input type="number" step="0.0001" value={edit.unit_cost||0} onChange={(e)=>setEdit({...edit,unit_cost:Number(e.target.value)})} /></label>
                <label>Current unit price: <input type="number" step="0.0001" value={edit.current_unit_price||0} onChange={(e)=>setEdit({...edit,current_unit_price:Number(e.target.value)})} /></label>
              </>
            )}
            <label>Amount (principal): <input type="number" value={edit.amount} onChange={(e)=>setEdit({...edit,amount:Number(e.target.value)})} /></label>
            {(['FD','RD','BOND'].includes(String(edit.type).toUpperCase())) && (
              <>
                <label>Rate %: <input type="number" step="0.01" value={edit.rate ?? edit.interest_rate} onChange={(e)=>setEdit({...edit,rate:Number(e.target.value)})} /></label>
                <label>Compounding:
                  <select value={edit.compounding||1} onChange={(e)=>setEdit({...edit,compounding:Number(e.target.value)})}>
                    <option value={1}>Annual</option>
                    <option value={4}>Quarterly</option>
                    <option value={12}>Monthly</option>
                  </select>
                </label>
                <label>Tenure months: <input type="number" value={edit.tenure_months||0} onChange={(e)=>setEdit({...edit,tenure_months:Number(e.target.value)})} /></label>
                <label>Maturity date: <input type="date" value={(edit.maturity_date || '').slice(0,10)} onChange={(e)=>setEdit({...edit,maturity_date:e.target.value})} /></label>
              </>
            )}
            {(!['FD','RD','BOND'].includes(String(edit.type).toUpperCase())) && (
              <>
                <label>Cashout amount: <input type="number" value={edit.cashout_amount || 0} onChange={(e)=>setEdit({...edit,cashout_amount:Number(e.target.value)})} /></label>
                <label>Cashout date: <input type="date" value={(edit.cashout_date || '').slice(0,10)} onChange={(e)=>setEdit({...edit,cashout_date:e.target.value})} /></label>
              </>
            )}
            <label>Start date: <input type="date" value={(edit.start_date || edit.date || '').slice(0,10)} onChange={(e)=>setEdit({...edit,start_date:e.target.value})} /></label>
            <label>Source (debit) Account: <AccountSelector value={edit.account_id} onChange={(val)=>setEdit({...edit,account_id:val})} /></label>
            <label>Payout (credit) Account: <AccountSelector value={edit.payout_account_id || edit.account_id} onChange={(val)=>setEdit({...edit,payout_account_id:val})} /></label>
            <label>Status:
              <select value={edit.status || 'Created'} onChange={(e)=>setEdit({...edit,status:e.target.value})}>
                <option value="Created">Created</option>
                <option value="Running">Running</option>
                <option value="Stashed">Stashed</option>
                <option value="Matured">Matured</option>
                <option value="CashedOut">CashedOut</option>
                <option value="Closed">Closed</option>
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
      {inlineAssign && (
        <SimpleModal open={!!inlineAssign} title={inlineAssign.mode==='debit'?'Assign Source Account':'Assign Payout Account'} onClose={()=>setInlineAssign(null)}>
          <div style={{display:'grid', gap:8}}>
            <AccountSelector value={assignAccountId} onChange={(val)=>setAssignAccountId(val)} />
            <div style={{display:'flex',gap:8}}>
              <button className="btn accent" onClick={confirmInlineAssign} disabled={!assignAccountId}>Save</button>
              <button className="btn" onClick={()=>setInlineAssign(null)}>Cancel</button>
            </div>
          </div>
        </SimpleModal>
      )}

      {/* Action Modal */}
      <SimpleModal open={!!actionInv} title={actionInv && (
        actionMode === 'mature' ? 'Mature Fixed Deposit' : actionMode === 'cashout' ? 'Cash Out Investment' : 'Stash Investment'
      )} onClose={()=>{ setActionInv(null); setActionMode(null); }}>
        {actionInv && (
          <div style={{display:'grid', gap: 8}}>
            <div className="muted">{actionInv.type} — {actionInv.institution}</div>
            <label>Amount:
              <input type="number" value={actionForm.amount} onChange={(e)=>setActionForm(f=>({...f, amount: Number(e.target.value)}))} />
            </label>
            <label>Date:
              <input type="date" value={actionForm.date} onChange={(e)=>setActionForm(f=>({...f, date: e.target.value}))} />
            </label>
            <label>{actionMode === 'stash' ? 'Holding / Future Payout Account' : 'Credit Account'}:
              <AccountSelector value={actionForm.account_id} onChange={(val)=>setActionForm(f=>({...f, account_id: val}))} />
            </label>
            <label>Notes:
              <input value={actionForm.notes} onChange={(e)=>setActionForm(f=>({...f, notes: e.target.value}))} />
            </label>
            <div style={{display:'flex', gap:8, marginTop:8}}>
              <button className="btn accent" onClick={confirmAction}>Confirm</button>
              <button className="btn" onClick={()=>{ setActionInv(null); setActionMode(null); }}>Cancel</button>
            </div>
          </div>
        )}
      </SimpleModal>
    </FinanceLayout>
  );
}
