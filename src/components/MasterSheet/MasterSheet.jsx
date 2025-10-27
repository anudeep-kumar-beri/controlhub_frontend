import React, { useEffect, useState, useCallback } from 'react';
import './masterSheet.css';
import { getMasterRows, saveOverride } from '../../db/financeStore';

export default function MasterSheet() {
  const [rows, setRows] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [period, setPeriod] = useState('this_month');

  const loadRows = useCallback(async () => {
    let opts = {};
    const now = new Date();
    if (period === 'this_month') {
      opts.fromMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      opts.toMonth = opts.fromMonth;
    } else if (period === 'this_year') {
      opts.fromMonth = `${now.getFullYear()}-01`;
      opts.toMonth = `${now.getFullYear()}-12`;
    }
    const data = await getMasterRows(opts);
    setRows(data);
  }, [period]);

  useEffect(() => { loadRows(); }, [loadRows]);

  function toggleEdit() { setEditMode(!editMode); }

  async function handleSaveOverride(row) {
    const override = { inflow: row.inflow_total, outflow: row.outflow_total, notes: row.notes };
    await saveOverride(row.id, override);
  await loadRows();
    setEditMode(false);
  }

  function updateRowValue(idx, field, value) {
    const copy = [...rows];
    copy[idx] = { ...copy[idx], [field]: value };
    copy[idx].net = (Number(copy[idx].inflow_total) || 0) - (Number(copy[idx].outflow_total) || 0);
    setRows(copy);
  }

  return (
    <div className="master-sheet">
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <label>Period:</label>
        <select value={period} onChange={(e)=>setPeriod(e.target.value)}>
          <option value="this_month">This month</option>
          <option value="this_year">This year</option>
          <option value="all">All</option>
        </select>
        <button onClick={toggleEdit}>{editMode ? 'Exit Edit' : 'Edit'}</button>
      </div>

      <div className="ms-row ms-header">
        <div>Label</div>
        <div>Inflow</div>
        <div>Outflow</div>
        <div>Net</div>
        <div>Notes</div>
        {editMode && <div>Actions</div>}
      </div>

      {rows.map((r, idx) => (
        <div className="ms-row" key={r.id}>
          <div>{r.label}</div>
          <div>
            {editMode ? (
              <input type="number" value={r.inflow_total} onChange={(e)=>updateRowValue(idx,'inflow_total',e.target.value)} />
            ) : (
              <span>{r.inflow_total || '—'}</span>
            )}
          </div>
          <div>
            {editMode ? (
              <input type="number" value={r.outflow_total} onChange={(e)=>updateRowValue(idx,'outflow_total',e.target.value)} />
            ) : (
              <span>{r.outflow_total || '—'}</span>
            )}
          </div>
          <div>{r.net}</div>
          <div>
            {editMode ? (
              <input value={r.notes || ''} onChange={(e)=>updateRowValue(idx,'notes',e.target.value)} />
            ) : (
              <span>{r.notes}</span>
            )}
          </div>
          {editMode && (
            <div>
              <button onClick={()=>handleSaveOverride(r)}>Save</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
