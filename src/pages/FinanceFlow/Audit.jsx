import React from 'react';
import FinanceLayout from '../../components/finance/FinanceLayout.jsx';

export default function Audit() {
  return (
    <FinanceLayout title="Audit & Exports">
      <div className="card">
        <div className="card-header"><strong>Exports</strong></div>
        <div className="card-body" style={{display:'flex',gap:8}}>
          <button className="btn" onClick={async ()=>{ const m = await import('../../utils/finance/sheetExport'); const res = await m.exportWorkbook('xlsx'); alert(res?.message || 'Export triggered'); }}>Export Excel</button>
          <button className="btn" onClick={async ()=>{ const m = await import('../../utils/finance/sheetExport'); const res = await m.exportWorkbook('pdf'); alert(res?.message || 'Export triggered'); }}>Export PDF</button>
        </div>
      </div>
    </FinanceLayout>
  );
}
