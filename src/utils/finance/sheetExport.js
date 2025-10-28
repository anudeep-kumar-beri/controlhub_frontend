// sheetExport.js — placeholder; defer heavy deps (xlsx, jspdf) via dynamic imports later
// Try to dynamically import SheetJS (xlsx) and jsPDF when requested.
import { listInvestments, listIncome, listExpenses, listLoans, getMasterTransactions } from '../../db/stores/financeStore';

function loadSettings() {
  const DEFAULTS = { currencyCode: 'INR', locale: 'en-IN' };
  try { const raw = localStorage.getItem('finance_settings_v1'); return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS; } catch { return DEFAULTS; }
}
function fmtCurrency(n) {
  const s = loadSettings();
  try { return new Intl.NumberFormat(s.locale, { style:'currency', currency:s.currencyCode, maximumFractionDigits:2 }).format(Number(n)||0); }
  catch { return `${(Number(n)||0).toLocaleString(s.locale)} ${s.currencyCode}`; }
}

export async function exportWorkbook(type = 'xlsx') {
  try {
    if (type === 'xlsx') {
      // Try dynamic import of xlsx
      let XLSX;
      try {
        XLSX = (await import('xlsx')).default || (await import('xlsx'));
      } catch (e) {
        // xlsx not installed — fallback to CSV export of master only
        return { ok: false, message: 'xlsx package not installed. Install "xlsx" to enable Excel export.' };
      }

      // Gather data
      const [investments, income, expenses, loans, tx] = await Promise.all([
        listInvestments(), listIncome(), listExpenses(), listLoans(), getMasterTransactions({})
      ]);

      // Build workbook with multiple sheets
      const wb = XLSX.utils.book_new();
      
      // Create Master sheet from transactions (aggregate by category for summary)
      const categoryMap = new Map();
      for (const t of tx) {
        const cat = t.category || 'Other';
        if (!categoryMap.has(cat)) categoryMap.set(cat, { inflow: 0, outflow: 0 });
        const entry = categoryMap.get(cat);
        entry.inflow += Number(t.inflow || 0);
        entry.outflow += Number(t.outflow || 0);
      }
      const masterRows = Array.from(categoryMap.entries()).map(([label, { inflow, outflow }]) => ({
        Label: label,
        Inflow: inflow,
        Outflow: outflow,
        Net: inflow - outflow,
        Notes: ''
      }));
      const totals = masterRows.reduce((acc, r)=>{
        acc.in += Number(r.Inflow)||0; acc.out += Number(r.Outflow)||0; return acc;
      }, { in:0, out:0 });
      const wsMaster = XLSX.utils.json_to_sheet(masterRows);
      // Append totals row (keep numbers numeric for Excel)
      XLSX.utils.sheet_add_aoa(wsMaster, [[ 'TOTAL', totals.in, totals.out, totals.in - totals.out, '' ]], { origin: -1 });
      XLSX.utils.book_append_sheet(wb, wsMaster, 'Master Summary');

      const wsInv = XLSX.utils.json_to_sheet(investments || []);
      XLSX.utils.book_append_sheet(wb, wsInv, 'Investments');
      const wsInc = XLSX.utils.json_to_sheet(income || []);
      XLSX.utils.book_append_sheet(wb, wsInc, 'Income');
      const wsExp = XLSX.utils.json_to_sheet(expenses || []);
      XLSX.utils.book_append_sheet(wb, wsExp, 'Expenses');
      const wsLoan = XLSX.utils.json_to_sheet(loans || []);
      XLSX.utils.book_append_sheet(wb, wsLoan, 'Loans');

      // Transactions sheet with totals footer
      const inflow = tx.reduce((s,r)=> s + (Number(r.inflow)||0), 0);
      const outflow = tx.reduce((s,r)=> s + (Number(r.outflow)||0), 0);
      const wsTx = XLSX.utils.json_to_sheet((tx||[]).map(r => ({
        Date: r.date,
        Category: r.category,
        Inflow: r.inflow || 0,
        Outflow: r.outflow || 0,
        Net: (Number(r.inflow)||0) - (Number(r.outflow)||0),
        Notes: r.notes || ''
      })));
      XLSX.utils.sheet_add_aoa(wsTx, [[ 'TOTAL', '', inflow, outflow, inflow - outflow, '' ]], { origin: -1 });
      XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financeflow-export-${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      return { ok: true, message: 'Excel exported' };
    }

    if (type === 'pdf') {
      let jsPDF;
      try {
        jsPDF = (await import('jspdf')).default || (await import('jspdf'));
        await import('jspdf-autotable');
      } catch (e) {
        return { ok: false, message: 'jsPDF not available' };
      }

  const doc = new jsPDF();
      doc.text('FinanceFlow Export - Transactions', 10, 10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 10, 18);

  const tx = await getMasterTransactions({});
  const totIn = tx.reduce((s,r)=> s + (Number(r.inflow)||0), 0);
  const totOut = tx.reduce((s,r)=> s + (Number(r.outflow)||0), 0);
  const totNet = totIn - totOut;
  doc.text(`Totals — In: ${fmtCurrency(totIn)}  Out: ${fmtCurrency(totOut)}  Net: ${fmtCurrency(totNet)}`, 10, 26);
      const head = [['Date','Category','Inflow','Outflow','Net','Notes']];
  const body = tx.map(r => [r.date, r.category, fmtCurrency(r.inflow), fmtCurrency(r.outflow), fmtCurrency((Number(r.inflow)||0)-(Number(r.outflow)||0)), r.notes || '']);
      // jspdf-autotable registers itself on jsPDF instance
  doc.autoTable({ startY: 32, head, body, styles: { fontSize: 9 } });

  // No second page needed since we only have transactions now

  const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financeflow-export-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      return { ok: true, message: 'PDF exported' };
    }

    return { ok: false, message: 'Unknown export type' };
  } catch (err) {
    return { ok: false, message: err.message || String(err) };
  }
}
