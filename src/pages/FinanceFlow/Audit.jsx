import React, { useState, useEffect } from 'react';
import FinanceLayout from '../../components/finance/FinanceLayout.jsx';
import { listInvestments, listIncome, listExpenses, listLoans, listAccounts, getMasterTransactions } from '../../db/stores/financeStore';
import { useCurrencyFormatter, todayISO } from '../../utils/format';

export default function Audit() {
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [dateRange, setDateRange] = useState({ from: '', to: todayISO() });
  const [reportType, setReportType] = useState('balance_sheet');
  const [loading, setLoading] = useState(false);
  const fmt = useCurrencyFormatter();

  // Initialize date range to current year
  useEffect(() => {
    const now = new Date();
    const yearStart = `${now.getFullYear()}-01-01`;
    setDateRange({ from: yearStart, to: todayISO() });
  }, []);

  // Calculate balance sheet data
  const calculateBalanceSheet = async () => {
    setLoading(true);
    try {
      const [investments, income, expenses, loans, accounts, transactions] = await Promise.all([
        listInvestments(),
        listIncome(),
        listExpenses(),
        listLoans(),
        listAccounts(),
        getMasterTransactions({ fromDate: dateRange.from, toDate: dateRange.to })
      ]);

      // Filter by date range
      const filterByDate = (items, dateField = 'date') => {
        return items.filter(item => {
          const date = item[dateField] || item.start_date || item.date || '';
          return (!dateRange.from || date >= dateRange.from) && (!dateRange.to || date <= dateRange.to);
        });
      };

      const filteredInvestments = filterByDate(investments);
      const filteredIncome = filterByDate(income);
      const filteredExpenses = filterByDate(expenses);
      const filteredLoans = filterByDate(loans);

      // ASSETS
      const investmentAssets = filteredInvestments.reduce((sum, inv) => {
        if (['Matured', 'CashedOut'].includes(inv.status)) {
          return sum + (Number(inv.cashout_amount) || Number(inv.amount) || 0);
        }
        return sum + (Number(inv.amount) || 0);
      }, 0);

      const accountBalances = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
      
      const totalAssets = investmentAssets + accountBalances;

      // LIABILITIES
      const outstandingLoans = filteredLoans.reduce((sum, loan) => {
        if (loan.status === 'Paid') return sum;
        const outstanding = Number(loan.outstanding_balance) || Number(loan.amount) || 0;
        return sum + outstanding;
      }, 0);

      const pendingExpenses = filteredExpenses.reduce((sum, exp) => {
        if (exp.status === 'Paid') return sum;
        return sum + (Number(exp.outflow) || 0);
      }, 0);

      const totalLiabilities = outstandingLoans + pendingExpenses;

      // EQUITY
      const totalEquity = totalAssets - totalLiabilities;

      // INCOME STATEMENT
      const totalRevenue = filteredIncome.reduce((sum, inc) => sum + (Number(inc.inflow) || 0), 0);
      const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (Number(exp.outflow) || 0), 0);
      const netIncome = totalRevenue - totalExpenses;

      // CASH FLOW
      const operatingCashFlow = transactions.reduce((sum, tx) => {
        if (tx.category?.toLowerCase().includes('investment') || 
            tx.category?.toLowerCase().includes('loan')) return sum;
        return sum + ((Number(tx.inflow) || 0) - (Number(tx.outflow) || 0));
      }, 0);

      const investingCashFlow = transactions.reduce((sum, tx) => {
        if (tx.category?.toLowerCase().includes('investment')) {
          return sum + ((Number(tx.inflow) || 0) - (Number(tx.outflow) || 0));
        }
        return sum;
      }, 0);

      const financingCashFlow = transactions.reduce((sum, tx) => {
        if (tx.category?.toLowerCase().includes('loan')) {
          return sum + ((Number(tx.inflow) || 0) - (Number(tx.outflow) || 0));
        }
        return sum;
      }, 0);

      setBalanceSheet({
        assets: {
          investments: investmentAssets,
          accounts: accountBalances,
          total: totalAssets
        },
        liabilities: {
          loans: outstandingLoans,
          pendingExpenses: pendingExpenses,
          total: totalLiabilities
        },
        equity: {
          netWorth: totalEquity
        },
        incomeStatement: {
          revenue: totalRevenue,
          expenses: totalExpenses,
          netIncome: netIncome
        },
        cashFlow: {
          operating: operatingCashFlow,
          investing: investingCashFlow,
          financing: financingCashFlow,
          total: operatingCashFlow + investingCashFlow + financingCashFlow
        }
      });
    } catch (err) {
      console.error('Failed to calculate balance sheet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      calculateBalanceSheet();
    }
  }, [dateRange]);

  const handleExport = async (type) => {
    const m = await import('../../utils/finance/sheetExport');
    const res = await m.exportWorkbook(type, { reportType, dateRange, balanceSheet });
    alert(res?.message || 'Export triggered');
  };

  return (
    <FinanceLayout title="Audit & Reports">
      {/* Date Range & Report Type Selection */}
      <div className="card" style={{marginBottom: 16}}>
        <div className="card-header"><strong>Report Configuration</strong></div>
        <div className="card-body" style={{display:'grid', gap:12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'}}>
          <label>
            Report Type:
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} style={{width: '100%'}}>
              <option value="balance_sheet">Balance Sheet</option>
              <option value="income_statement">Income Statement</option>
              <option value="cash_flow">Cash Flow Statement</option>
              <option value="comprehensive">Comprehensive Report (All)</option>
            </select>
          </label>
          <label>
            From Date:
            <input type="date" value={dateRange.from} onChange={(e) => setDateRange({...dateRange, from: e.target.value})} style={{width: '100%'}} />
          </label>
          <label>
            To Date:
            <input type="date" value={dateRange.to} onChange={(e) => setDateRange({...dateRange, to: e.target.value})} style={{width: '100%'}} />
          </label>
          <div style={{display: 'flex', alignItems: 'flex-end', gap: 8}}>
            <button className="btn" onClick={calculateBalanceSheet} disabled={loading}>
              {loading ? 'Calculating...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="card" style={{marginBottom: 16}}>
        <div className="card-header"><strong>Export Options</strong></div>
        <div className="card-body" style={{display:'flex', gap:8, flexWrap: 'wrap'}}>
          <button className="btn primary" onClick={() => handleExport('xlsx')}>
            📊 Export to Excel
          </button>
          <button className="btn primary" onClick={() => handleExport('pdf')}>
            📄 Export to PDF
          </button>
          <button className="btn" onClick={() => handleExport('csv')}>
            📋 Export to CSV
          </button>
        </div>
      </div>

      {/* Balance Sheet Preview */}
      {balanceSheet && (
        <>
          {(reportType === 'balance_sheet' || reportType === 'comprehensive') && (
            <div className="card" style={{marginBottom: 16}}>
              <div className="card-header"><strong>Balance Sheet</strong> <span className="muted">as of {dateRange.to}</span></div>
              <div className="card-body">
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24}}>
                  {/* Assets Column */}
                  <div>
                    <h3 style={{marginTop: 0, borderBottom: '2px solid #667eea', paddingBottom: 8}}>Assets</h3>
                    <table style={{width: '100%', marginBottom: 16}}>
                      <tbody>
                        <tr>
                          <td style={{padding: '8px 0'}}>Investments</td>
                          <td style={{textAlign: 'right', fontWeight: 600}}>{fmt(balanceSheet.assets.investments)}</td>
                        </tr>
                        <tr>
                          <td style={{padding: '8px 0'}}>Cash & Bank Accounts</td>
                          <td style={{textAlign: 'right', fontWeight: 600}}>{fmt(balanceSheet.assets.accounts)}</td>
                        </tr>
                        <tr style={{borderTop: '2px solid #ddd'}}>
                          <td style={{padding: '12px 0', fontWeight: 'bold', fontSize: '1.1em'}}>Total Assets</td>
                          <td style={{textAlign: 'right', fontWeight: 'bold', fontSize: '1.1em', color: '#667eea'}}>
                            {fmt(balanceSheet.assets.total)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Liabilities & Equity Column */}
                  <div>
                    <h3 style={{marginTop: 0, borderBottom: '2px solid #f56565', paddingBottom: 8}}>Liabilities</h3>
                    <table style={{width: '100%', marginBottom: 16}}>
                      <tbody>
                        <tr>
                          <td style={{padding: '8px 0'}}>Outstanding Loans</td>
                          <td style={{textAlign: 'right', fontWeight: 600}}>{fmt(balanceSheet.liabilities.loans)}</td>
                        </tr>
                        <tr>
                          <td style={{padding: '8px 0'}}>Pending Expenses</td>
                          <td style={{textAlign: 'right', fontWeight: 600}}>{fmt(balanceSheet.liabilities.pendingExpenses)}</td>
                        </tr>
                        <tr style={{borderTop: '2px solid #ddd'}}>
                          <td style={{padding: '12px 0', fontWeight: 'bold'}}>Total Liabilities</td>
                          <td style={{textAlign: 'right', fontWeight: 'bold', color: '#f56565'}}>
                            {fmt(balanceSheet.liabilities.total)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <h3 style={{marginTop: 24, borderBottom: '2px solid #48bb78', paddingBottom: 8}}>Equity</h3>
                    <table style={{width: '100%'}}>
                      <tbody>
                        <tr style={{borderTop: '2px solid #ddd'}}>
                          <td style={{padding: '12px 0', fontWeight: 'bold', fontSize: '1.1em'}}>Net Worth</td>
                          <td style={{textAlign: 'right', fontWeight: 'bold', fontSize: '1.1em', color: '#48bb78'}}>
                            {fmt(balanceSheet.equity.netWorth)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Balance Check */}
                <div style={{marginTop: 24, padding: 16, background: '#f7fafc', borderRadius: 8, border: '2px solid #e2e8f0'}}>
                  <div style={{textAlign: 'center', fontSize: '0.9em', color: '#666'}}>
                    Balance Check: Assets ({fmt(balanceSheet.assets.total)}) = Liabilities ({fmt(balanceSheet.liabilities.total)}) + Equity ({fmt(balanceSheet.equity.netWorth)})
                  </div>
                </div>
              </div>
            </div>
          )}

          {(reportType === 'income_statement' || reportType === 'comprehensive') && (
            <div className="card" style={{marginBottom: 16}}>
              <div className="card-header"><strong>Income Statement</strong> <span className="muted">{dateRange.from} to {dateRange.to}</span></div>
              <div className="card-body">
                <table style={{width: '100%', maxWidth: 600}}>
                  <tbody>
                    <tr>
                      <td style={{padding: '12px 0', fontSize: '1.1em', fontWeight: 600}}>Revenue</td>
                      <td style={{textAlign: 'right', fontSize: '1.1em', fontWeight: 600, color: '#48bb78'}}>
                        {fmt(balanceSheet.incomeStatement.revenue)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{padding: '12px 0', fontSize: '1.1em', fontWeight: 600}}>Expenses</td>
                      <td style={{textAlign: 'right', fontSize: '1.1em', fontWeight: 600, color: '#f56565'}}>
                        {fmt(balanceSheet.incomeStatement.expenses)}
                      </td>
                    </tr>
                    <tr style={{borderTop: '3px solid #ddd'}}>
                      <td style={{padding: '16px 0', fontSize: '1.2em', fontWeight: 'bold'}}>Net Income</td>
                      <td style={{textAlign: 'right', fontSize: '1.2em', fontWeight: 'bold', color: balanceSheet.incomeStatement.netIncome >= 0 ? '#48bb78' : '#f56565'}}>
                        {fmt(balanceSheet.incomeStatement.netIncome)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(reportType === 'cash_flow' || reportType === 'comprehensive') && (
            <div className="card">
              <div className="card-header"><strong>Cash Flow Statement</strong> <span className="muted">{dateRange.from} to {dateRange.to}</span></div>
              <div className="card-body">
                <table style={{width: '100%', maxWidth: 600}}>
                  <tbody>
                    <tr>
                      <td style={{padding: '12px 0', fontWeight: 600}}>Operating Activities</td>
                      <td style={{textAlign: 'right', fontWeight: 600, color: balanceSheet.cashFlow.operating >= 0 ? '#48bb78' : '#f56565'}}>
                        {fmt(balanceSheet.cashFlow.operating)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{padding: '12px 0', fontWeight: 600}}>Investing Activities</td>
                      <td style={{textAlign: 'right', fontWeight: 600, color: balanceSheet.cashFlow.investing >= 0 ? '#48bb78' : '#f56565'}}>
                        {fmt(balanceSheet.cashFlow.investing)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{padding: '12px 0', fontWeight: 600}}>Financing Activities</td>
                      <td style={{textAlign: 'right', fontWeight: 600, color: balanceSheet.cashFlow.financing >= 0 ? '#48bb78' : '#f56565'}}>
                        {fmt(balanceSheet.cashFlow.financing)}
                      </td>
                    </tr>
                    <tr style={{borderTop: '3px solid #ddd'}}>
                      <td style={{padding: '16px 0', fontSize: '1.2em', fontWeight: 'bold'}}>Net Cash Flow</td>
                      <td style={{textAlign: 'right', fontSize: '1.2em', fontWeight: 'bold', color: balanceSheet.cashFlow.total >= 0 ? '#48bb78' : '#f56565'}}>
                        {fmt(balanceSheet.cashFlow.total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </FinanceLayout>
  );
}
