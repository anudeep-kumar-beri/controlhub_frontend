import React, { useState, useEffect } from 'react';
import FinanceLayout from '../../components/finance/FinanceLayout.jsx';
import { listInvestments, listIncome, listExpenses, listLoans, listAccounts, getMasterTransactions } from '../../db/stores/financeStore';
import { useCurrencyFormatter, todayISO } from '../../utils/format';
import { calculateFD } from '../../utils/finance/financeCalc';
import { generateTransactionStatementPDF } from '../../utils/finance/transactionStatementPDF';

// Helper function to add months to a date
function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

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
      const [investments, expenses, loans, accounts, allTransactions] = await Promise.all([
        listInvestments(),
        listExpenses(),
        listLoans(),
        listAccounts(),
        getMasterTransactions() // Get ALL transactions for accurate account balances
      ]);

      // Get transactions for the specific date range for P&L statements
      const rangeTransactions = allTransactions.filter(tx => {
        return (!dateRange.from || tx.date >= dateRange.from) && (!dateRange.to || tx.date <= dateRange.to);
      });

      // Calculate ACTUAL account balances from all transactions up to the 'to' date
      const accountBalances = {};
      let totalAccountBalance = 0;
      
      for (const acc of accounts) {
        // Get all transactions for this account up to the report date
        const accTransactions = allTransactions.filter(tx => 
          tx.account_id === acc.id && tx.date <= dateRange.to
        );
        
        const balance = accTransactions.reduce((sum, tx) => 
          sum + (Number(tx.inflow) || 0) - (Number(tx.outflow) || 0), 0
        );
        
        accountBalances[acc.id] = { name: acc.name, balance };
        totalAccountBalance += balance;
      }

      // Calculate CURRENT VALUE of investments (as of 'to' date)
      let totalInvestmentValue = 0;
      const today = dateRange.to;
      
      for (const inv of investments) {
        const startDate = inv.start_date || inv.date || today;
        
        // Only include investments that started before or on the report date
        if (startDate > today) continue;
        
        const amount = Number(inv.amount) || 0;
        const rate = Number(inv.interest_rate || inv.rate) || 0;
        const tenure = Number(inv.tenure_months || inv.tenure) || 0;
        const invType = (inv.type || '').toUpperCase();
        
        if (invType === 'FD' && rate > 0 && tenure > 0) {
          // Calculate current value based on time elapsed
          const maturityDate = inv.maturity_date || addMonths(startDate, tenure);
          
          if (today >= maturityDate) {
            // Matured - use maturity value
            const { maturity_value } = calculateFD({ amount, interest_rate: rate, tenure_months: tenure });
            totalInvestmentValue += maturity_value;
          } else {
            // Still active - calculate pro-rata value
            const monthsElapsed = Math.max(0, Math.floor(
              (new Date(today) - new Date(startDate)) / (1000 * 60 * 60 * 24 * 30.44)
            ));
            const { maturity_value } = calculateFD({ 
              amount, 
              interest_rate: rate, 
              tenure_months: Math.min(monthsElapsed, tenure) 
            });
            totalInvestmentValue += maturity_value;
          }
        } else if (inv.cashout_date && inv.cashout_date <= today && inv.cashout_amount) {
          // Cashed out investment
          totalInvestmentValue += Number(inv.cashout_amount) || 0;
        } else {
          // Active non-FD investment - use original amount
          totalInvestmentValue += amount;
        }
      }

      // TOTAL ASSETS = Current Investment Value + Actual Account Balances
      const totalAssets = totalInvestmentValue + totalAccountBalance;

      // LIABILITIES - Calculate actual outstanding amounts
      let totalOutstandingLoans = 0;
      
      for (const loan of loans) {
        const loanAmount = Number(loan.amount_borrowed || loan.amount) || 0;
        
        // Calculate total payments made on this loan up to report date
        const loanPayments = allTransactions.filter(tx => 
          tx.source?.store === 'loan_payments' &&
          tx.source?.type === 'principal' &&
          tx.date <= today &&
          tx.category?.includes(loan.lender || '')
        );
        
        const totalPaid = loanPayments.reduce((sum, tx) => sum + (Number(tx.outflow) || 0), 0);
        const outstanding = Math.max(0, loanAmount - totalPaid);
        
        totalOutstandingLoans += outstanding;
      }

      // Pending expenses (unpaid/pending status only)
      // An expense is a liability ONLY if it's not yet paid AND not yet recorded in transactions
      const pendingExpenses = expenses
        .filter(exp => {
          // Exclude if explicitly marked as paid
          if (exp.status === 'Paid' || exp.status === 'paid') return false;
          // Exclude if date is in the future
          if (exp.date && exp.date > today) return false;
          // Include ONLY if status is explicitly "Pending" or "pending" or "Unpaid"
          // This ensures paid expenses (even without status field) don't count as liabilities
          return exp.status && (exp.status === 'Pending' || exp.status === 'pending' || exp.status === 'Unpaid' || exp.status === 'unpaid');
        })
        .reduce((sum, exp) => sum + (Number(exp.outflow || exp.amount) || 0), 0);

      const totalLiabilities = totalOutstandingLoans + pendingExpenses;

      // EQUITY = Assets - Liabilities (fundamental accounting equation)
      const totalEquity = totalAssets - totalLiabilities;

      // INCOME STATEMENT (for date range)
      const totalRevenue = rangeTransactions
        .filter(tx => tx.inflow > 0 && tx.category?.toLowerCase().includes('income'))
        .reduce((sum, tx) => sum + (Number(tx.inflow) || 0), 0);
      
      const totalExpenses = rangeTransactions
        .filter(tx => tx.outflow > 0 && tx.category?.toLowerCase().includes('expense'))
        .reduce((sum, tx) => sum + (Number(tx.outflow) || 0), 0);
      
      const netIncome = totalRevenue - totalExpenses;

      // CASH FLOW STATEMENT (for date range)
      const operatingCashFlow = rangeTransactions.reduce((sum, tx) => {
        const cat = tx.category?.toLowerCase() || '';
        if (cat.includes('investment') || cat.includes('loan')) return sum;
        return sum + ((Number(tx.inflow) || 0) - (Number(tx.outflow) || 0));
      }, 0);

      const investingCashFlow = rangeTransactions.reduce((sum, tx) => {
        if (tx.category?.toLowerCase().includes('investment')) {
          return sum + ((Number(tx.inflow) || 0) - (Number(tx.outflow) || 0));
        }
        return sum;
      }, 0);

      const financingCashFlow = rangeTransactions.reduce((sum, tx) => {
        if (tx.category?.toLowerCase().includes('loan')) {
          return sum + ((Number(tx.inflow) || 0) - (Number(tx.outflow) || 0));
        }
        return sum;
      }, 0);

      setBalanceSheet({
        assets: {
          investments: totalInvestmentValue,
          accounts: totalAccountBalance,
          accountDetails: accountBalances, // Detailed breakdown by account
          total: totalAssets
        },
        liabilities: {
          loans: totalOutstandingLoans,
          pendingExpenses: pendingExpenses,
          total: totalLiabilities
        },
        equity: {
          netWorth: totalEquity,
          retainedEarnings: netIncome // For the period
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);
  const handleExport = async (type) => {
    const m = await import('../../utils/finance/sheetExport');
    const res = await m.exportWorkbook(type, { reportType, dateRange, balanceSheet });
    alert(res?.message || 'Export triggered');
  };

  const handleTransactionStatement = async () => {
    setLoading(true);
    try {
      const res = await generateTransactionStatementPDF({
        from: dateRange.from,
        to: dateRange.to
      });
      alert(res?.message || 'Transaction statement generated');
    } catch (err) {
      alert('Failed to generate transaction statement: ' + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
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

      {/* Important Note */}
      <div className="card" style={{marginBottom: 16, borderLeft: '4px solid #667eea', backgroundColor: '#f7fafc'}}>
        <div className="card-body">
          <p style={{margin: 0, fontSize: '0.9em', color: '#4a5568'}}>
            <strong>📊 Balance Sheet Calculation:</strong> Account balances are calculated from <strong>actual transaction history</strong> (all inflows - outflows) up to the selected date. 
            Investments show their <strong>current/maturity value</strong>, not just original amounts. 
            This ensures the balance sheet accurately reflects your true financial position.
          </p>
        </div>
      </div>

      {/* Export Options */}
      <div className="card" style={{marginBottom: 16}}>
        <div className="card-header"><strong>Export Options</strong></div>
        <div className="card-body">
          {/* Financial Reports Section */}
          <div style={{marginBottom: 16}}>
            <h4 style={{fontSize: '0.95em', marginBottom: 8, color: '#667eea', fontWeight: 600}}>
              📊 Financial Reports
            </h4>
            <p style={{fontSize: '0.85em', color: '#666', marginBottom: 10}}>
              Balance Sheet, Income Statement, and Cash Flow based on selected report type
            </p>
            <div style={{display:'flex', gap:8, flexWrap: 'wrap'}}>
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

          {/* Divider */}
          <div style={{borderTop: '1px solid #e2e8f0', margin: '16px 0'}}></div>

          {/* Transaction Statement Section */}
          <div>
            <h4 style={{fontSize: '0.95em', marginBottom: 8, color: '#48bb78', fontWeight: 600}}>
              📋 Transaction Statement
            </h4>
            <p style={{fontSize: '0.85em', color: '#666', marginBottom: 10}}>
              Detailed transaction-by-transaction statement with ControlHub branding and running balance
            </p>
            <button className="btn" style={{backgroundColor: '#48bb78', color: 'white', border: 'none'}} onClick={handleTransactionStatement}>
              📄 Generate Transaction Statement PDF
            </button>
          </div>
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
                          <td style={{padding: '8px 0'}}>Investments (Current Value)</td>
                          <td style={{textAlign: 'right', fontWeight: 600}}>{fmt(balanceSheet.assets.investments)}</td>
                        </tr>
                        <tr>
                          <td style={{padding: '8px 0', paddingLeft: 16, fontSize: '0.9em', color: '#666'}}>
                            Cash & Bank Accounts:
                          </td>
                          <td style={{textAlign: 'right'}}></td>
                        </tr>
                        {balanceSheet.assets.accountDetails && Object.entries(balanceSheet.assets.accountDetails).map(([id, acc]) => (
                          <tr key={id}>
                            <td style={{padding: '4px 0', paddingLeft: 32, fontSize: '0.85em', color: '#555'}}>
                              {acc.name}
                            </td>
                            <td style={{textAlign: 'right', fontSize: '0.9em'}}>{fmt(acc.balance)}</td>
                          </tr>
                        ))}
                        <tr>
                          <td style={{padding: '8px 0', paddingLeft: 16, fontWeight: 600}}>Total Cash & Bank</td>
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
