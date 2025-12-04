// transactionStatementPDF.js — Professional Transaction Statement PDF Generator
import { getMasterTransactions } from '../../db/stores/financeStore';

function loadSettings() {
  const DEFAULTS = { currencyCode: 'INR', locale: 'en-IN' };
  try { 
    const raw = localStorage.getItem('finance_settings_v1'); 
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS; 
  } catch { 
    return DEFAULTS; 
  }
}

function fmtCurrency(n) {
  const s = loadSettings();
  try { 
    return new Intl.NumberFormat(s.locale, { 
      style:'currency', 
      currency:s.currencyCode, 
      maximumFractionDigits:2 
    }).format(Number(n)||0); 
  } catch { 
    return `${(Number(n)||0).toLocaleString(s.locale)} ${s.currencyCode}`; 
  }
}

/**
 * Generate a professional transaction statement PDF with ControlHub branding
 * @param {Object} options - Configuration options
 * @param {string} options.from - Start date (YYYY-MM-DD)
 * @param {string} options.to - End date (YYYY-MM-DD)
 * @param {string} options.accountFilter - Optional account ID filter
 * @param {string} options.categoryFilter - Optional category filter
 */
export async function generateTransactionStatementPDF(options = {}) {
  const { from, to, accountFilter, categoryFilter } = options;

  try {
    // Dynamic import jsPDF and autoTable
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    // Fetch all transactions
    let transactions = await getMasterTransactions({ from, to });

    // Apply filters if specified
    if (accountFilter && accountFilter !== 'all') {
      transactions = transactions.filter(tx => tx.account_id === accountFilter);
    }
    if (categoryFilter && categoryFilter !== 'all') {
      transactions = transactions.filter(tx => 
        tx.category && tx.category.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    // Sort by date ascending for running balance
    transactions.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.timestamp || a.createdAt || '').localeCompare(b.timestamp || b.createdAt || '');
    });

    if (transactions.length === 0) {
      return { ok: false, message: 'No transactions found for the selected date range and filters.' };
    }

    // Calculate statistics
    const totalInflow = transactions.reduce((sum, tx) => sum + (Number(tx.inflow) || 0), 0);
    const totalOutflow = transactions.reduce((sum, tx) => sum + (Number(tx.outflow) || 0), 0);
    const netAmount = totalInflow - totalOutflow;
    const transactionCount = transactions.length;

    // Calculate running balance
    let runningBalance = 0;
    const transactionsWithBalance = transactions.map(tx => {
      const inflowNum = Number(tx.inflow) || 0;
      const outflowNum = Number(tx.outflow) || 0;
      runningBalance += inflowNum - outflowNum;
      return {
        ...tx,
        runningBalance: runningBalance
      };
    });

    // Initialize PDF - A4 size
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // ===== HEADER SECTION =====
    let yPos = 20;

    // Try to add logo (if available)
    try {
      // Load logo as base64 - using the 192x192 PNG
      const logoPath = '/android-chrome-192x192.png';
      const logoImg = await loadImageAsBase64(logoPath);
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', margin, yPos - 5, 20, 20);
      }
    } catch (e) {
      console.warn('Logo not loaded:', e);
    }

    // Header Title
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(66, 66, 66);
    doc.text('ControlHub', margin + 25, yPos + 5);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Financial Management System', margin + 25, yPos + 11);

    // Statement title on right
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(52, 73, 94);
    doc.text('Transaction Statement', pageWidth - margin, yPos + 5, { align: 'right' });

    // Divider line
    yPos += 18;
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.8);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    // ===== STATEMENT INFO SECTION =====
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(66, 66, 66);

    const infoStartY = yPos;
    
    // Left column
    doc.setFont(undefined, 'bold');
    doc.text('Statement Period:', margin, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(`${from || 'Beginning'} to ${to || 'Today'}`, margin + 40, yPos);
    
    yPos += 6;
    doc.setFont(undefined, 'bold');
    doc.text('Generated:', margin, yPos);
    doc.setFont(undefined, 'normal');
    const now = new Date();
    doc.text(now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }), margin + 40, yPos);

    yPos += 6;
    if (accountFilter && accountFilter !== 'all') {
      doc.setFont(undefined, 'bold');
      doc.text('Account Filter:', margin, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(accountFilter, margin + 40, yPos);
      yPos += 6;
    }
    if (categoryFilter && categoryFilter !== 'all') {
      doc.setFont(undefined, 'bold');
      doc.text('Category Filter:', margin, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(categoryFilter, margin + 40, yPos);
      yPos += 6;
    }

    yPos = Math.max(yPos, infoStartY + 18);

    // ===== SUMMARY SECTION =====
    yPos += 5;
    doc.setFillColor(247, 250, 252);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 30, 'F');

    yPos += 8;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(52, 73, 94);
    doc.text('Summary', margin + 4, yPos);

    yPos += 8;
    doc.setFontSize(10);
    
    const summaryColWidth = (pageWidth - 2 * margin - 8) / 3;
    
    // Total Inflow
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Total Inflow', margin + 4, yPos);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(72, 187, 120);
    doc.text(fmtCurrency(totalInflow), margin + 4, yPos + 5);

    // Total Outflow
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Total Outflow', margin + 4 + summaryColWidth, yPos);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(245, 101, 101);
    doc.text(fmtCurrency(totalOutflow), margin + 4 + summaryColWidth, yPos + 5);

    // Net Amount
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Net Amount', margin + 4 + 2 * summaryColWidth, yPos);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(netAmount >= 0 ? 72 : 245, netAmount >= 0 ? 187 : 101, netAmount >= 0 ? 120 : 101);
    doc.text(fmtCurrency(netAmount), margin + 4 + 2 * summaryColWidth, yPos + 5);

    yPos += 12;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Total Transactions: ${transactionCount}`, margin + 4, yPos);

    yPos += 10;

    // ===== TRANSACTION TABLE =====
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(52, 73, 94);
    doc.text('Transaction Details', margin, yPos);
    yPos += 2;

    // Build table data
    const tableHeaders = [['Date', 'Category', 'Account', 'Inflow', 'Outflow', 'Balance', 'Notes']];
    const tableData = transactionsWithBalance.map(tx => [
      tx.date || '-',
      (tx.category || 'Uncategorized').substring(0, 18),
      (tx.account_name || 'N/A').substring(0, 15),
      tx.inflow > 0 ? fmtCurrency(tx.inflow) : '-',
      tx.outflow > 0 ? fmtCurrency(tx.outflow) : '-',
      fmtCurrency(tx.runningBalance),
      (tx.notes || '').substring(0, 25)
    ]);

    doc.autoTable({
      startY: yPos + 3,
      head: tableHeaders,
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [66, 66, 66]
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { cellWidth: 22, halign: 'left' },    // Date
        1: { cellWidth: 32, halign: 'left' },    // Category
        2: { cellWidth: 28, halign: 'left' },    // Account
        3: { cellWidth: 22, halign: 'right', textColor: [72, 187, 120] },   // Inflow
        4: { cellWidth: 22, halign: 'right', textColor: [245, 101, 101] },  // Outflow
        5: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },           // Balance
        6: { cellWidth: 'auto', halign: 'left', textColor: [100, 100, 100] } // Notes
      },
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
        // Add page number at bottom
        const pageCount = doc.internal.getNumberOfPages();
        const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
        
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${pageNum} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        
        // Footer line
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        
        // Footer text
        doc.text('ControlHub - Confidential Transaction Statement', pageWidth / 2, pageHeight - 6, { align: 'center' });
      }
    });

    // ===== EXPORT PDF =====
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `ControlHub_Transaction_Statement_${from || 'all'}_to_${to || new Date().toISOString().slice(0, 10)}.pdf`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    return { ok: true, message: `Transaction statement exported: ${filename}` };

  } catch (error) {
    console.error('Transaction statement generation error:', error);
    return { ok: false, message: error.message || String(error) };
  }
}

/**
 * Helper function to load image as base64
 */
async function loadImageAsBase64(path) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      try {
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = (e) => reject(e);
    img.src = path;
  });
}
