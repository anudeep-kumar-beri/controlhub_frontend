// sheetExport.js — placeholder; defer heavy deps (xlsx, jspdf) via dynamic imports later
// Try to dynamically import SheetJS (xlsx) and jsPDF when requested.
import { listInvestments, listIncome, listExpenses, listLoans, getMasterRows } from '../db/financeStore';

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
      const [investments, income, expenses, loans, master] = await Promise.all([
        listInvestments(), listIncome(), listExpenses(), listLoans(), getMasterRows()
      ]);

      // Build workbook with multiple sheets
      const wb = XLSX.utils.book_new();
      const wsMaster = XLSX.utils.json_to_sheet(master.map(r => ({
        Label: r.label,
        Inflow: r.inflow_total,
        Outflow: r.outflow_total,
        Net: r.net,
        Notes: r.notes
      })));
      XLSX.utils.book_append_sheet(wb, wsMaster, 'Master PlusMinus');

      const wsInv = XLSX.utils.json_to_sheet(investments || []);
      XLSX.utils.book_append_sheet(wb, wsInv, 'Investments');
      const wsInc = XLSX.utils.json_to_sheet(income || []);
      XLSX.utils.book_append_sheet(wb, wsInc, 'Income');
      const wsExp = XLSX.utils.json_to_sheet(expenses || []);
      XLSX.utils.book_append_sheet(wb, wsExp, 'Expenses');
      const wsLoan = XLSX.utils.json_to_sheet(loans || []);
      XLSX.utils.book_append_sheet(wb, wsLoan, 'Loans');

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
      doc.text('FinanceFlow Export - Master Sheet', 10, 10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 10, 18);

      const master = await getMasterRows();
      const head = [['Label','Inflow','Outflow','Net','Notes']];
      const body = master.map(r => [r.label, r.inflow_total, r.outflow_total, r.net, r.notes || '']);
      // jspdf-autotable registers itself on jsPDF instance
      doc.autoTable({ startY: 24, head, body, styles: { fontSize: 9 } });

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
