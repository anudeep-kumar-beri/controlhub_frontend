import React, { useEffect, useMemo, useState } from 'react';
import FinanceLayout from '../../components/finance/FinanceLayout.jsx';
import { getMasterTransactions, updateNotesForRecord, patchRecord } from '../../db/stores/financeStore';
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
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
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

  // Sorted rows based on sortConfig
  const sortedRows = useMemo(() => {
    const arr = [...rows];
    const { key, direction } = sortConfig;
    const multiplier = direction === 'asc' ? 1 : -1;
    
    arr.sort((a, b) => {
      if (key === 'date') {
        return (a.date || '').localeCompare(b.date || '') * multiplier;
      } else if (key === 'category') {
        return (a.category || '').localeCompare(b.category || '') * multiplier;
      } else if (key === 'inflow') {
        return ((Number(a.inflow) || 0) - (Number(b.inflow) || 0)) * multiplier;
      } else if (key === 'outflow') {
        return ((Number(a.outflow) || 0) - (Number(b.outflow) || 0)) * multiplier;
      } else if (key === 'net') {
        return (a.net - b.net) * multiplier;
      }
      return 0;
    });
    
    return arr;
  }, [rows, sortConfig]);

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
        <label style={{color:'var(--finance-text)'}}>Sort:
          <select value={`${sortConfig.key}_${sortConfig.direction}`} onChange={(e)=>{ const [key, dir] = e.target.value.split('_'); setSortConfig({key, direction:dir}); }}>
            <option value="date_desc">Date ↓</option>
            <option value="date_asc">Date ↑</option>
            <option value="category_asc">Category ↑</option>
            <option value="category_desc">Category ↓</option>
            <option value="inflow_desc">Inflow ↓</option>
            <option value="inflow_asc">Inflow ↑</option>
            <option value="outflow_desc">Outflow ↓</option>
            <option value="outflow_asc">Outflow ↑</option>
            <option value="net_desc">Net ↓</option>
            <option value="net_asc">Net ↑</option>
          </select>
        </label>
        <button className="btn" onClick={()=>{ setPeriod('this_month'); setRange(monthRangeOf(new Date())); }}>
          Current
        </button>
        <button className="btn" onClick={()=>{ setPeriod('custom'); setRange({ from: '0001-01-01', to: todayISO() }); }}>
          Overall
        </button>
      </div>

      <div className="card" style={{display:'flex', flexDirection:'column', minHeight:0, height:'calc(100vh - 200px)'}}>
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
        <div className="card-body" style={{overflow:'auto', flex:1, minHeight:0}}>
          <table className={`table ${density==='compact'?'table-compact':''}`} style={{position:'relative'}}>
            <thead style={{position:'sticky', top:0, backgroundColor:'var(--finance-surface, #11151c)', zIndex:10, boxShadow:'0 2px 4px rgba(0,0,0,0.2)'}}>
              <tr>
                <th style={{width: '120px', position:'sticky', top:0, backgroundColor:'var(--finance-surface, #11151c)'}}>Date</th>
                <th style={{position:'sticky', top:0, backgroundColor:'var(--finance-surface, #11151c)'}}>Category</th>
                <th style={{width: '150px', position:'sticky', top:0, backgroundColor:'var(--finance-surface, #11151c)'}}>Account</th>
                <th className="right" style={{width: '140px', position:'sticky', top:0, backgroundColor:'var(--finance-surface, #11151c)'}}>Inflow</th>
                <th className="right" style={{width: '140px', position:'sticky', top:0, backgroundColor:'var(--finance-surface, #11151c)'}}>Outflow</th>
                <th className="right" style={{width: '140px', position:'sticky', top:0, backgroundColor:'var(--finance-surface, #11151c)'}}>Net</th>
                <th style={{position:'sticky', top:0, backgroundColor:'var(--finance-surface, #11151c)'}}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map(r => (
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
