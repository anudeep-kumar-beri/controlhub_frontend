import React, { useEffect, useMemo, useState } from 'react';
import FinanceLayout from '../../components/finance/FinanceLayout.jsx';
import { getMasterTransactions, updateNotesForRecord, patchRecord, listAccounts } from '../../db/stores/financeStore';
import { useCurrencyFormatter, todayISO } from '../../utils/format';
import AccountSelector from '../../components/finance/AccountSelector.jsx';

function monthRangeOf(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const from = `${y}-${m}-01`;
  const to = new Date(y, date.getMonth() + 1, 0).toISOString().slice(0,10);
  return { from, to };
}

export default function MasterSheetPage() {
  const [period, setPeriod] = useState('this_month');
  const [range, setRange] = useState(()=> monthRangeOf(new Date()));
  const [rows, setRows] = useState([]);
  const [density, setDensity] = useState('comfortable');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [filterAccount, setFilterAccount] = useState(null);
  const [reassignRow, setReassignRow] = useState(null);
  const [reassignAccount, setReassignAccount] = useState(null);
  const fmt = useCurrencyFormatter();

  useEffect(() => { 
    (async ()=>{
      let fromDate = null, toDate = null;
      if (period === 'this_month') { 
        const { from, to } = monthRangeOf(new Date()); 
        fromDate = from; 
        toDate = to; 
      } else if (period === 'this_year') { 
        const y = new Date().getFullYear(); 
        fromDate = `${y}-01-01`; 
        toDate = `${y}-12-31`; 
      } else if (period === 'custom') { 
        fromDate = range.from || null; 
        toDate = range.to || null; 
      }
      const tx = await getMasterTransactions({ fromDate, toDate, accountId: filterAccount });
      setRows(tx);
    })();
  }, [period, range.from, range.to, filterAccount]);

  const totals = useMemo(()=>{
    const inflow = rows.reduce((s,r)=> s + (Number(r.inflow)||0), 0);
    const outflow = rows.reduce((s,r)=> s + (Number(r.outflow)||0), 0);
    return { inflow, outflow, net: inflow - outflow };
  }, [rows]);

  async function startEdit(row) {
    setEditingId(row.id);
    setEditText(row.notes || '');
  }

  async function saveEdit(row) {
    if (!row?.source) { setEditingId(null); return; }
    await updateNotesForRecord(row.source.store, row.source.id, editText);
    setEditingId(null);
    // Refresh list
    let fromDate = null, toDate = null;
    if (period === 'this_month') { 
      const { from, to } = monthRangeOf(new Date()); 
      fromDate = from; 
      toDate = to; 
    } else if (period === 'this_year') { 
      const y = new Date().getFullYear(); 
      fromDate = `${y}-01-01`; 
      toDate = `${y}-12-31`; 
    } else if (period === 'custom') { 
      fromDate = range.from || null; 
      toDate = range.to || null; 
    }
    const tx = await getMasterTransactions({ fromDate, toDate });
    setRows(tx);
  }

  return (
    <FinanceLayout title="Master Transactions">
      <div className="toolbar" style={{marginBottom:12}}>
        <label style={{color:'var(--finance-text)'}}>Period:</label>
        <select value={period} onChange={(e)=>setPeriod(e.target.value)}>
          <option value="this_month">This month</option>
          <option value="this_year">This year</option>
          <option value="custom">Custom</option>
        </select>
        {period === 'custom' && (
          <>
            <label style={{color:'var(--finance-text)'}}>From: 
              <input type="date" value={range.from||''} onChange={(e)=>setRange(r=>({...r,from:e.target.value}))} />
            </label>
            <label style={{color:'var(--finance-text)'}}>To: 
              <input type="date" value={range.to||''} onChange={(e)=>setRange(r=>({...r,to:e.target.value}))} />
            </label>
          </>
        )}
        <label style={{color:'var(--finance-text)'}}>Account: 
          <AccountSelector value={filterAccount} onChange={setFilterAccount} allowUnassigned={true} />
        </label>
        <button className="btn" onClick={()=>{ setPeriod('this_month'); setRange(monthRangeOf(new Date())); }}>
          Current
        </button>
        <button className="btn" onClick={()=>{ setPeriod('custom'); setRange({ from: '0001-01-01', to: todayISO() }); }}>
          Overall
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <strong>Unified Master Sheet</strong>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <label style={{color:'var(--finance-muted)', fontSize:12}}>Density</label>
            <select value={density} onChange={(e)=>setDensity(e.target.value)}>
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
            <span style={{color:'var(--finance-muted)',fontSize:12}}>{rows.length} transactions</span>
          </div>
        </div>
        <div className="card-body" style={{overflow:'auto', maxHeight:'60vh'}}>
          <table className={`table ${density==='compact'?'table-compact':''}`}>
            <thead>
              <tr>
                <th style={{width: '120px'}}>Date</th>
                <th>Category</th>
                <th style={{width: '150px'}}>Account</th>
                <th className="right" style={{width: '140px'}}>Inflow</th>
                <th className="right" style={{width: '140px'}}>Outflow</th>
                <th className="right" style={{width: '140px'}}>Net</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.category}</td>
                  <td style={{fontSize:'0.85rem',opacity:0.8}}>
                    {r.account_name || 'Unassigned'}
                    {(!r.account_id) && r.source?.store && (
                      <button className="btn" style={{marginLeft:6,padding:'2px 6px',fontSize:'0.65rem'}} onClick={()=>{ setReassignRow(r); setReassignAccount(null); }}>
                        Assign
                      </button>
                    )}
                  </td>
                  <td className={`right ${r.inflow>0?'text-pos':''}`}>
                    {r.inflow ? fmt(r.inflow) : '—'}
                  </td>
                  <td className={`right ${r.outflow>0?'text-neg':''}`}>
                    {r.outflow ? fmt(r.outflow) : '—'}
                  </td>
                  <td className="right">
                    {fmt(r.net)}
                  </td>
                  <td>
                    {editingId === r.id ? (
                      <div style={{display:'flex',gap:6}}>
                        <input value={editText} onChange={(e)=>setEditText(e.target.value)} />
                        <button className="btn accent" onClick={()=>saveEdit(r)}>Save</button>
                        <button className="btn" onClick={()=>setEditingId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <span onClick={()=>startEdit(r)} style={{cursor:'text'}}>
                        {r.notes || <span className="muted">Add note</span>}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{borderTop:'2px solid rgba(255,255,255,0.2)'}}>
                <th>Total</th>
                <th></th>
                <th></th>
                <th className="right">{fmt(totals.inflow)}</th>
                <th className="right">{fmt(totals.outflow)}</th>
                <th className="right">{fmt(totals.net)}</th>
                <th></th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {reassignRow && (
        <div className="modal-backdrop">
          <div className="modal" style={{maxWidth:420}}>
            <h3 style={{marginTop:0}}>Assign Account</h3>
            <p style={{fontSize:'0.8rem',opacity:0.7}}>Link this transaction so balances reconcile. Transaction: <strong>{reassignRow.category}</strong> on {reassignRow.date}</p>
            <label style={{display:'block',marginBottom:12}}>Account:
              <AccountSelector value={reassignAccount} onChange={setReassignAccount} allowUnassigned={false} />
            </label>
            <div style={{display:'flex',gap:8}}>
              <button className="btn accent" disabled={!reassignAccount} onClick={async ()=>{
                const store = reassignRow.source?.store;
                const id = reassignRow.source?.id;
                if (store && id && reassignAccount) {
                  await patchRecord(store, id, { account_id: reassignAccount });
                  // reload rows
                  let fromDate = null, toDate = null;
                  if (period === 'this_month') { const { from, to } = monthRangeOf(new Date()); fromDate = from; toDate = to; }
                  else if (period === 'this_year') { const y = new Date().getFullYear(); fromDate = `${y}-01-01`; toDate = `${y}-12-31`; }
                  else if (period === 'custom') { fromDate = range.from || null; toDate = range.to || null; }
                  const tx = await getMasterTransactions({ fromDate, toDate, accountId: filterAccount });
                  setRows(tx);
                }
                setReassignRow(null);
              }}>Save</button>
              <button className="btn" onClick={()=>setReassignRow(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </FinanceLayout>
  );
}
