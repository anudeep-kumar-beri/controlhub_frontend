import React from 'react';
import FinanceNav from '../../components/finance/FinanceNav';
import MasterSheet from '../../components/MasterSheet/MasterSheet';
import { exportWorkbook } from '../../utils/sheetExport';

export default function MasterSheetPage() {
  return (
    <div className="page finance-master-sheet">
      <FinanceNav />
      <h1>Master Plus/Minus Sheet</h1>
      <p>Aggregated inflow/outflow and net. Edit-mode and overrides will be added.</p>
      <div style={{display:'flex',gap:8,marginBottom:8}}>
        <button onClick={async ()=>{ const res = await exportWorkbook('xlsx'); alert(res?.message || 'Export triggered'); }}>Export Excel</button>
        <button onClick={async ()=>{ const res = await exportWorkbook('pdf'); alert(res?.message || 'PDF export triggered'); }}>Export PDF</button>
      </div>
      <MasterSheet />
    </div>
  );
}
