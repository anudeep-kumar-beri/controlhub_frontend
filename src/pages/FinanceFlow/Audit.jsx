import React from 'react';
import FinanceNav from '../../components/finance/FinanceNav';

export default function Audit() {
  return (
    <div className="page finance-audit">
      <FinanceNav />
      <h1>Audit & Exports</h1>
      <p>Audit log view and export controls (PDF/XLSX) will appear here.</p>
      <div style={{display:'flex',gap:8}}>
        <button onClick={async ()=>{ const m = await import('../../utils/sheetExport'); const res = await m.exportWorkbook('xlsx'); alert(res?.message || 'Export triggered'); }}>Export Excel</button>
        <button onClick={async ()=>{ const m = await import('../../utils/sheetExport'); const res = await m.exportWorkbook('pdf'); alert(res?.message || 'Export triggered'); }}>Export PDF</button>
      </div>
    </div>
  );
}
