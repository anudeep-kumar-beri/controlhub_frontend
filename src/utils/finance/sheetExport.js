// sheetExport.js — Professional financial exports with Balance Sheet support
import { listInvestments, listIncome, listExpenses, listLoans, getMasterTransactions, listAccounts } from '../../db/stores/financeStore';

function loadSettings() {
  const DEFAULTS = { currencyCode: 'INR', locale: 'en-IN' };
  try { const raw = localStorage.getItem('finance_settings_v1'); return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS; } catch { return DEFAULTS; }
}
function fmtCurrency(n) {
  const s = loadSettings();
  try { return new Intl.NumberFormat(s.locale, { style:'currency', currency:s.currencyCode, maximumFractionDigits:2 }).format(Number(n)||0); }
  catch { return `${(Number(n)||0).toLocaleString(s.locale)} ${s.currencyCode}`; }
}
function fmtNumber(n) {
  return Number(n)||0;
}

export async function exportWorkbook(type = 'xlsx', options = {}) {
  const { reportType = 'comprehensive', dateRange = {}, balanceSheet = null } = options;
  const dateLabel = dateRange.from && dateRange.to ? ` (${dateRange.from} to ${dateRange.to})` : '';
  
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

      // ===== BALANCE SHEET =====
      if (balanceSheet && (reportType === 'balance_sheet' || reportType === 'comprehensive')) {
        const bsRows = [
          ['BALANCE SHEET', '', '', ''],
          [`As of ${dateRange.to || 'Today'}`, '', '', ''],
          ['', '', '', ''],
          ['ASSETS', '', '', 'Amount'],
          ['  Investments (Current Value)', '', '', fmtCurrency(balanceSheet.assets.investments)],
          ['  Cash & Bank Accounts', '', '', fmtCurrency(balanceSheet.assets.accounts)],
          ['', '', 'Total Assets', fmtCurrency(balanceSheet.assets.total)],
          ['', '', '', ''],
          ['LIABILITIES', '', '', 'Amount'],
          ['  Outstanding Loans', '', '', fmtCurrency(balanceSheet.liabilities.loans)],
          ['  Pending Expenses', '', '', fmtCurrency(balanceSheet.liabilities.pendingExpenses)],
          ['', '', 'Total Liabilities', fmtCurrency(balanceSheet.liabilities.total)],
          ['', '', '', ''],
          ['EQUITY', '', '', 'Amount'],
          ['', '', 'Net Worth', fmtCurrency(balanceSheet.equity.netWorth)],
          ['', '', '', ''],
          ['VERIFICATION', '', '', ''],
          ['  Assets', '', '', fmtCurrency(balanceSheet.assets.total)],
          ['  Liabilities + Equity', '', '', fmtCurrency(balanceSheet.liabilities.total + balanceSheet.equity.netWorth)],
          ['  Difference', '', '', fmtCurrency(balanceSheet.assets.total - (balanceSheet.liabilities.total + balanceSheet.equity.netWorth))],
        ];
        const wsBS = XLSX.utils.aoa_to_sheet(bsRows);
        
        // Column widths for better readability
        wsBS['!cols'] = [
          { wch: 5 }, { wch: 5 }, { wch: 30 }, { wch: 20 }
        ];
        
        // Merge cells for headers
        if (!wsBS['!merges']) wsBS['!merges'] = [];
        wsBS['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }); // Title
        wsBS['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }); // Date
        
        XLSX.utils.book_append_sheet(wb, wsBS, 'Balance Sheet');
      }

      // ===== INCOME STATEMENT =====
      if (balanceSheet && (reportType === 'income_statement' || reportType === 'comprehensive')) {
        const isRows = [
          ['INCOME STATEMENT', '', '', ''],
          [dateLabel, '', '', ''],
          ['', '', '', ''],
          ['REVENUE', '', '', ''],
          ['  Total Revenue', '', '', fmtCurrency(balanceSheet.incomeStatement.revenue)],
          ['', '', '', ''],
          ['EXPENSES', '', '', ''],
          ['  Total Expenses', '', '', fmtCurrency(balanceSheet.incomeStatement.expenses)],
          ['', '', '', ''],
          ['', '', 'NET INCOME', fmtCurrency(balanceSheet.incomeStatement.netIncome)],
          ['', '', '', ''],
          ['', '', 'Profit Margin %', balanceSheet.incomeStatement.revenue > 0 ? 
            `${((balanceSheet.incomeStatement.netIncome / balanceSheet.incomeStatement.revenue) * 100).toFixed(2)}%` : '0%'],
        ];
        const wsIS = XLSX.utils.aoa_to_sheet(isRows);
        
        // Column widths
        wsIS['!cols'] = [
          { wch: 5 }, { wch: 5 }, { wch: 25 }, { wch: 20 }
        ];
        
        if (!wsIS['!merges']) wsIS['!merges'] = [];
        wsIS['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }); // Title
        wsIS['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }); // Date
        
        XLSX.utils.book_append_sheet(wb, wsIS, 'Income Statement');
      }

      // ===== CASH FLOW STATEMENT =====
      if (balanceSheet && (reportType === 'cash_flow' || reportType === 'comprehensive')) {
        const cfRows = [
          ['CASH FLOW STATEMENT', '', '', ''],
          [dateLabel, '', '', ''],
          ['', '', '', ''],
          ['CASH FLOWS FROM:', '', '', ''],
          ['  Operating Activities', '', '', fmtCurrency(balanceSheet.cashFlow.operating)],
          ['  Investing Activities', '', '', fmtCurrency(balanceSheet.cashFlow.investing)],
          ['  Financing Activities', '', '', fmtCurrency(balanceSheet.cashFlow.financing)],
          ['', '', '', ''],
          ['', '', 'NET CASH FLOW', fmtCurrency(balanceSheet.cashFlow.total)],
          ['', '', '', ''],
          ['SUMMARY', '', '', ''],
          ['  Cash Increase/(Decrease)', '', '', balanceSheet.cashFlow.total >= 0 ? 'Positive' : 'Negative'],
        ];
        const wsCF = XLSX.utils.aoa_to_sheet(cfRows);
        
        // Column widths
        wsCF['!cols'] = [
          { wch: 5 }, { wch: 5 }, { wch: 28 }, { wch: 20 }
        ];
        
        if (!wsCF['!merges']) wsCF['!merges'] = [];
        wsCF['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }); // Title
        wsCF['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }); // Date
        
        XLSX.utils.book_append_sheet(wb, wsCF, 'Cash Flow Statement');
      }
      
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
        'Category': label,
        'Inflow': fmtCurrency(inflow),
        'Outflow': fmtCurrency(outflow),
        'Net': fmtCurrency(inflow - outflow),
        'Balance Type': inflow - outflow >= 0 ? 'Surplus' : 'Deficit'
      }));
      const totals = Array.from(categoryMap.values()).reduce((acc, r)=>{
        acc.in += Number(r.inflow)||0; acc.out += Number(r.outflow)||0; return acc;
      }, { in:0, out:0 });
      
      const wsMaster = XLSX.utils.json_to_sheet(masterRows);
      
      // Column widths
      wsMaster['!cols'] = [
        { wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 15 }
      ];
      
      // Append totals row
      XLSX.utils.sheet_add_aoa(wsMaster, [[ 'TOTAL', fmtCurrency(totals.in), fmtCurrency(totals.out), fmtCurrency(totals.in - totals.out), totals.in - totals.out >= 0 ? 'Surplus' : 'Deficit' ]], { origin: -1 });
      
      XLSX.utils.book_append_sheet(wb, wsMaster, 'Master Summary');

      // Investments sheet with better formatting
      const invData = (investments || []).map(inv => ({
        'Type': inv.type || '',
        'Institution': inv.institution || '',
        'Amount': fmtCurrency(inv.amount || 0),
        'Rate (%)': inv.interest_rate || inv.rate || '',
        'Tenure (months)': inv.tenure_months || inv.tenure || '',
        'Start Date': inv.start_date || inv.date || '',
        'Maturity Date': inv.maturity_date || '',
        'Status': inv.status || '',
        'Payout Method': inv.interest_payout_method || 'at_maturity',
        'Notes': inv.notes || ''
      }));
      const wsInv = XLSX.utils.json_to_sheet(invData);
      wsInv['!cols'] = [
        { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 15 }, { wch: 30 }
      ];
      XLSX.utils.book_append_sheet(wb, wsInv, 'Investments');
      
      // Income sheet
      const incData = (income || []).map(inc => ({
        'Date': inc.date || '',
        'Source/Category': inc.source || inc.category || '',
        'Amount': fmtCurrency(inc.inflow || inc.amount || 0),
        'Account': inc.account_id || 'Unassigned',
        'Status': inc.status || 'Received',
        'Notes': inc.notes || ''
      }));
      const wsInc = XLSX.utils.json_to_sheet(incData);
      wsInc['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 35 }];
      XLSX.utils.book_append_sheet(wb, wsInc, 'Income');
      
      // Expenses sheet
      const expData = (expenses || []).map(exp => ({
        'Date': exp.date || '',
        'Category': exp.category || exp.title || '',
        'Amount': fmtCurrency(exp.outflow || exp.amount || 0),
        'Account': exp.account_id || 'Unassigned',
        'Status': exp.status || 'Paid',
        'Notes': exp.notes || ''
      }));
      const wsExp = XLSX.utils.json_to_sheet(expData);
      wsExp['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 35 }];
      XLSX.utils.book_append_sheet(wb, wsExp, 'Expenses');
      
      // Loans sheet
      const loanData = (loans || []).map(loan => ({
        'Lender': loan.lender || '',
        'Amount Borrowed': fmtCurrency(loan.amount_borrowed || loan.amount || 0),
        'Interest Rate (%)': loan.interest_rate || '',
        'Start Date': loan.start_date || loan.date || '',
        'Status': loan.status || 'Active',
        'Outstanding': loan.outstanding_balance ? fmtCurrency(loan.outstanding_balance) : '',
        'Notes': loan.notes || ''
      }));
      const wsLoan = XLSX.utils.json_to_sheet(loanData);
      wsLoan['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 35 }];
      XLSX.utils.book_append_sheet(wb, wsLoan, 'Loans');

      // Transactions sheet with totals footer
      const inflow = tx.reduce((s,r)=> s + (Number(r.inflow)||0), 0);
      const outflow = tx.reduce((s,r)=> s + (Number(r.outflow)||0), 0);
      const txData = (tx||[]).map(r => ({
        'Date': r.date,
        'Category': r.category,
        'Account': r.account_name || 'Unassigned',
        'Inflow': fmtCurrency(r.inflow || 0),
        'Outflow': fmtCurrency(r.outflow || 0),
        'Net': fmtCurrency((Number(r.inflow)||0) - (Number(r.outflow)||0)),
        'Notes': (r.notes || '').substring(0, 50)
      }));
      const wsTx = XLSX.utils.json_to_sheet(txData);
      wsTx['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 40 }];
      XLSX.utils.sheet_add_aoa(wsTx, [[ 'TOTAL', '', '', fmtCurrency(inflow), fmtCurrency(outflow), fmtCurrency(inflow - outflow), '' ]], { origin: -1 });
      XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `FinanceFlow_${reportType}_${dateRange.to || Date.now()}.xlsx`;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return { ok: true, message: `Excel exported: ${filename}` };
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
      let yPos = 15;

      // Header
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('FinanceFlow Report', 105, yPos, { align: 'center' });
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${new Date().toLocaleString()}`, 105, yPos, { align: 'center' });
      yPos += 5;
      if (dateLabel) {
        doc.text(dateLabel, 105, yPos, { align: 'center' });
        yPos += 10;
      } else {
        yPos += 8;
      }

      // ===== BALANCE SHEET =====
      if (balanceSheet && (reportType === 'balance_sheet' || reportType === 'comprehensive')) {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Balance Sheet', 14, yPos);
        yPos += 8;

        doc.autoTable({
          startY: yPos,
          head: [['ASSETS', 'Amount']],
          body: [
            ['Investments', fmtCurrency(balanceSheet.assets.investments)],
            ['Cash & Bank Accounts', fmtCurrency(balanceSheet.assets.accounts)],
            [{ content: 'Total Assets', styles: { fontStyle: 'bold' } }, 
             { content: fmtCurrency(balanceSheet.assets.total), styles: { fontStyle: 'bold', fillColor: [230, 240, 255] } }],
          ],
          theme: 'striped',
          headStyles: { fillColor: [102, 126, 234], fontSize: 11, fontStyle: 'bold' },
          styles: { fontSize: 10 },
          margin: { left: 14, right: 110 },
        });

        doc.autoTable({
          startY: yPos,
          head: [['LIABILITIES & EQUITY', 'Amount']],
          body: [
            [{ content: 'Liabilities', styles: { fontStyle: 'bold', fillColor: [255, 240, 240] } }, ''],
            ['Outstanding Loans', fmtCurrency(balanceSheet.liabilities.loans)],
            ['Pending Expenses', fmtCurrency(balanceSheet.liabilities.pendingExpenses)],
            [{ content: 'Total Liabilities', styles: { fontStyle: 'bold' } }, 
             { content: fmtCurrency(balanceSheet.liabilities.total), styles: { fontStyle: 'bold', fillColor: [255, 235, 235] } }],
            ['', ''],
            [{ content: 'Equity', styles: { fontStyle: 'bold', fillColor: [240, 255, 240] } }, ''],
            [{ content: 'Net Worth', styles: { fontStyle: 'bold' } }, 
             { content: fmtCurrency(balanceSheet.equity.netWorth), styles: { fontStyle: 'bold', fillColor: [235, 255, 235] } }],
          ],
          theme: 'striped',
          headStyles: { fillColor: [245, 101, 101], fontSize: 11, fontStyle: 'bold' },
          styles: { fontSize: 10 },
          margin: { left: 110, right: 14 },
        });

        yPos = doc.lastAutoTable.finalY + 15;
        
        if (reportType === 'comprehensive') {
          doc.addPage();
          yPos = 15;
        }
      }

      // ===== INCOME STATEMENT =====
      if (balanceSheet && (reportType === 'income_statement' || reportType === 'comprehensive')) {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Income Statement', 14, yPos);
        yPos += 8;

        doc.autoTable({
          startY: yPos,
          head: [['Item', 'Amount']],
          body: [
            ['Revenue', fmtCurrency(balanceSheet.incomeStatement.revenue)],
            ['Expenses', fmtCurrency(balanceSheet.incomeStatement.expenses)],
            [{ content: 'Net Income', styles: { fontStyle: 'bold', fontSize: 11 } }, 
             { content: fmtCurrency(balanceSheet.incomeStatement.netIncome), 
               styles: { fontStyle: 'bold', fontSize: 11, 
                 fillColor: balanceSheet.incomeStatement.netIncome >= 0 ? [235, 255, 235] : [255, 235, 235],
                 textColor: balanceSheet.incomeStatement.netIncome >= 0 ? [0, 100, 0] : [150, 0, 0] } }],
          ],
          theme: 'striped',
          headStyles: { fillColor: [72, 187, 120], fontSize: 11, fontStyle: 'bold' },
          styles: { fontSize: 10 },
        });

        yPos = doc.lastAutoTable.finalY + 15;
        
        if (reportType === 'comprehensive') {
          doc.addPage();
          yPos = 15;
        }
      }

      // ===== CASH FLOW STATEMENT =====
      if (balanceSheet && (reportType === 'cash_flow' || reportType === 'comprehensive')) {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Cash Flow Statement', 14, yPos);
        yPos += 8;

        doc.autoTable({
          startY: yPos,
          head: [['Activity', 'Amount']],
          body: [
            ['Operating Activities', fmtCurrency(balanceSheet.cashFlow.operating)],
            ['Investing Activities', fmtCurrency(balanceSheet.cashFlow.investing)],
            ['Financing Activities', fmtCurrency(balanceSheet.cashFlow.financing)],
            [{ content: 'Net Cash Flow', styles: { fontStyle: 'bold', fontSize: 11 } }, 
             { content: fmtCurrency(balanceSheet.cashFlow.total), 
               styles: { fontStyle: 'bold', fontSize: 11, 
                 fillColor: balanceSheet.cashFlow.total >= 0 ? [235, 255, 235] : [255, 235, 235] } }],
          ],
          theme: 'striped',
          headStyles: { fillColor: [66, 153, 225], fontSize: 11, fontStyle: 'bold' },
          styles: { fontSize: 10 },
        });

        yPos = doc.lastAutoTable.finalY + 15;
        
        if (reportType === 'comprehensive') {
          doc.addPage();
          yPos = 15;
        }
      }

      // ===== TRANSACTIONS DETAIL =====
      if (reportType === 'comprehensive') {
        const tx = await getMasterTransactions(dateRange);
        const totIn = tx.reduce((s,r)=> s + (Number(r.inflow)||0), 0);
        const totOut = tx.reduce((s,r)=> s + (Number(r.outflow)||0), 0);
        const totNet = totIn - totOut;

        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Transaction Details', 14, yPos);
        yPos += 5;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`In: ${fmtCurrency(totIn)} | Out: ${fmtCurrency(totOut)} | Net: ${fmtCurrency(totNet)}`, 14, yPos);
        yPos += 8;

        const head = [['Date','Category','Inflow','Outflow','Net','Notes']];
        const body = tx.map(r => [
          r.date, 
          r.category, 
          fmtCurrency(r.inflow), 
          fmtCurrency(r.outflow), 
          fmtCurrency((Number(r.inflow)||0)-(Number(r.outflow)||0)), 
          (r.notes || '').substring(0, 30)
        ]);

        doc.autoTable({ 
          startY: yPos, 
          head, 
          body, 
          styles: { fontSize: 8 },
          headStyles: { fillColor: [52, 73, 94], fontSize: 9, fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 30 },
            2: { cellWidth: 25, halign: 'right' },
            3: { cellWidth: 25, halign: 'right' },
            4: { cellWidth: 25, halign: 'right' },
            5: { cellWidth: 'auto' },
          }
        });
      }

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `FinanceFlow_${reportType}_${dateRange.to || Date.now()}.pdf`;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return { ok: true, message: `PDF exported: ${filename}` };
    }

    if (type === 'csv') {
      // CSV export for balance sheet
      if (!balanceSheet) {
        return { ok: false, message: 'No balance sheet data to export' };
      }

      let csvContent = '';
      
      if (reportType === 'balance_sheet' || reportType === 'comprehensive') {
        csvContent += 'BALANCE SHEET\n';
        csvContent += `As of ${dateRange.to || 'Today'}\n\n`;
        csvContent += 'ASSETS,Amount\n';
        csvContent += `Investments,${fmtNumber(balanceSheet.assets.investments)}\n`;
        csvContent += `Cash & Bank Accounts,${fmtNumber(balanceSheet.assets.accounts)}\n`;
        csvContent += `Total Assets,${fmtNumber(balanceSheet.assets.total)}\n\n`;
        csvContent += 'LIABILITIES,Amount\n';
        csvContent += `Outstanding Loans,${fmtNumber(balanceSheet.liabilities.loans)}\n`;
        csvContent += `Pending Expenses,${fmtNumber(balanceSheet.liabilities.pendingExpenses)}\n`;
        csvContent += `Total Liabilities,${fmtNumber(balanceSheet.liabilities.total)}\n\n`;
        csvContent += 'EQUITY,Amount\n';
        csvContent += `Net Worth,${fmtNumber(balanceSheet.equity.netWorth)}\n\n`;
      }

      if (reportType === 'income_statement' || reportType === 'comprehensive') {
        csvContent += '\nINCOME STATEMENT\n';
        csvContent += `${dateLabel}\n\n`;
        csvContent += 'Item,Amount\n';
        csvContent += `Revenue,${fmtNumber(balanceSheet.incomeStatement.revenue)}\n`;
        csvContent += `Expenses,${fmtNumber(balanceSheet.incomeStatement.expenses)}\n`;
        csvContent += `Net Income,${fmtNumber(balanceSheet.incomeStatement.netIncome)}\n\n`;
      }

      if (reportType === 'cash_flow' || reportType === 'comprehensive') {
        csvContent += '\nCASH FLOW STATEMENT\n';
        csvContent += `${dateLabel}\n\n`;
        csvContent += 'Activity,Amount\n';
        csvContent += `Operating Activities,${fmtNumber(balanceSheet.cashFlow.operating)}\n`;
        csvContent += `Investing Activities,${fmtNumber(balanceSheet.cashFlow.investing)}\n`;
        csvContent += `Financing Activities,${fmtNumber(balanceSheet.cashFlow.financing)}\n`;
        csvContent += `Net Cash Flow,${fmtNumber(balanceSheet.cashFlow.total)}\n`;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `FinanceFlow_${reportType}_${dateRange.to || Date.now()}.csv`;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return { ok: true, message: `CSV exported: ${filename}` };
    }

    return { ok: false, message: 'Unknown export type' };
  } catch (err) {
    return { ok: false, message: err.message || String(err) };
  }
}
