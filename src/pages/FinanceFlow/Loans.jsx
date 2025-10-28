import React, { useEffect, useMemo, useState } from 'react';
import FinanceLayout from '../../components/finance/FinanceLayout.jsx';
import { listLoans, saveLoan, deleteWithAudit, listLoanPayments, saveLoanPayment } from '../../db/stores/financeStore';
import SimpleModal from '../../components/common/SimpleModal';
import { useCurrencyFormatter, todayISO } from '../../utils/format';
import { calculatePaymentBreakdown, calculateAccruedInterest } from '../../utils/finance/loanCalculations';

export default function Loans() {
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ lender:'', amount_borrowed:0, start_date: todayISO(), interest_rate:0, status:'Active', notes:'' });
  const [edit, setEdit] = useState(null);
  const [payLoan, setPayLoan] = useState(null); // loan object to add repayment
  const [payForm, setPayForm] = useState({ amount:'', date: todayISO(), notes:'' });
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ q:'', status:'', from:'', to:'', sort:'date_desc' });
  const fmt = useCurrencyFormatter();

  async function load(){
    const [loans, pays] = await Promise.all([ listLoans(), listLoanPayments() ]);
    setItems(loans);
    setPayments(pays);
  }
  useEffect(()=>{ load(); }, []);

  async function add(){ if(!form.lender || Number(form.amount_borrowed)<=0){ setError('Lender and positive amount required'); return;} const payload = { ...form, outflow: form.amount_borrowed, label: form.lender, date: form.start_date }; await saveLoan(payload); setShowForm(false); setForm({ lender:'', amount_borrowed:0, start_date: todayISO(), interest_rate:0, status:'Active', notes:'' }); setError(''); await load(); }
  async function saveEdit(){ if((!edit.lender && !edit.label) || Number((edit.amount_borrowed ?? edit.outflow) || 0)<=0){ setError('Lender and positive amount required'); return;} const toSave = { ...edit, amount_borrowed: Number((edit.amount_borrowed ?? edit.outflow) || 0), outflow: Number((edit.amount_borrowed ?? edit.outflow) || 0), label: edit.lender || edit.label }; await saveLoan(toSave); setEdit(null); setError(''); await load(); }
  async function remove(id){ if(!window.confirm('Delete this loan?')) return; await deleteWithAudit('loans', id); await load(); }
  async function addPayment(){ if(!payLoan) return; const amt = Number(payForm.amount); if(isNaN(amt)||amt<=0) { setError('Enter a positive amount'); return;} const payload = { loan_id: payLoan.id, lender: payLoan.lender || payLoan.label, amount: amt, date: payForm.date, notes: payForm.notes }; await saveLoanPayment(payload); setPayLoan(null); setPayForm({ amount:'', date: todayISO(), notes:'' }); setError(''); await load(); }

  const filtered = useMemo(()=>{
    let arr = items.slice();
    if (filter.q) arr = arr.filter(i => ((i.lender||i.label||'')+(i.notes?' '+i.notes:'' )).toLowerCase().includes(filter.q.toLowerCase()));
    if (filter.status) arr = arr.filter(i => (i.status||'') === filter.status);
    const start = (i)=> i.start_date || i.date;
    if (filter.from) arr = arr.filter(i => (start(i)||'') >= filter.from);
    if (filter.to) arr = arr.filter(i => (start(i)||'') <= filter.to);
    const amt = (x)=> Number((x.amount_borrowed ?? x.outflow) || 0);
    if (filter.sort === 'amount_desc') arr.sort((a,b)=> (amt(b) - amt(a)));
    else if (filter.sort === 'amount_asc') arr.sort((a,b)=> (amt(a) - amt(b)));
    else if (filter.sort === 'date_asc') arr.sort((a,b)=> String(a.date||'').localeCompare(String(b.date||'')));
    else arr.sort((a,b)=> String(b.date||'').localeCompare(String(a.date||'')));
    return arr;
  }, [items, filter]);

  // compute repaid/outstanding map with interest breakdown
  const loanStats = useMemo(()=>{
    const m = new Map();
    
    for (const loan of items) {
      const borrowed = Number((loan.amount_borrowed ?? loan.outflow) || 0);
      const rate = Number(loan.interest_rate || 0);
      const startDate = (loan.start_date || loan.date || todayISO()).slice(0, 10);
      
      m.set(loan.id, {
        borrowed,
        rate,
        startDate,
        principalRepaid: 0,
        interestPaid: 0,
        lastPaymentDate: null,
        paymentCount: 0
      });
    }
    
    // Calculate breakdown for each payment
    const paymentsByLoan = new Map();
    for (const p of payments || []) {
      if (!paymentsByLoan.has(p.loan_id)) {
        paymentsByLoan.set(p.loan_id, []);
      }
      paymentsByLoan.get(p.loan_id).push(p);
    }
    
    for (const [loanId, loanPayments] of paymentsByLoan.entries()) {
      if (!m.has(loanId)) continue;
      
      const stats = m.get(loanId);
      loanPayments.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      
      let outstandingPrincipal = stats.borrowed;
      let lastDate = stats.startDate;
      
      for (const p of loanPayments) {
        const paymentAmount = Number(p.amount || 0);
        const paymentDate = p.date?.slice(0, 10) || todayISO();
        
        if (stats.rate > 0 && outstandingPrincipal > 0) {
          const breakdown = calculatePaymentBreakdown(
            paymentAmount,
            outstandingPrincipal,
            stats.rate,
            lastDate,
            paymentDate
          );
          stats.interestPaid += breakdown.interest;
          stats.principalRepaid += breakdown.principal;
          outstandingPrincipal -= breakdown.principal;
        } else {
          stats.principalRepaid += paymentAmount;
          outstandingPrincipal -= paymentAmount;
        }
        
        stats.lastPaymentDate = paymentDate;
        stats.paymentCount++;
        lastDate = paymentDate;
      }
    }
    
    return m;
  }, [items, payments]);

  return (
    <FinanceLayout title="Loans & Liabilities">
      <div className="toolbar" style={{marginBottom:12}}>
        <button className="btn primary" onClick={()=>setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add loan'}</button>
        <input type="search" placeholder="Search lender/notes" value={filter.q} onChange={(e)=>setFilter({...filter,q:e.target.value})} />
        <label>Status:
          <select value={filter.status} onChange={(e)=>setFilter({...filter,status:e.target.value})}>
            <option value="">All</option>
            <option value="Active">Active</option>
            <option value="Closed">Closed</option>
          </select>
        </label>
        <label>From: <input type="date" value={filter.from} onChange={(e)=>setFilter({...filter,from:e.target.value})} /></label>
        <label>To: <input type="date" value={filter.to} onChange={(e)=>setFilter({...filter,to:e.target.value})} /></label>
        <label>Sort:
          <select value={filter.sort} onChange={(e)=>setFilter({...filter,sort:e.target.value})}>
            <option value="date_desc">Date ↓</option>
            <option value="date_asc">Date ↑</option>
            <option value="amount_desc">Amount ↓</option>
            <option value="amount_asc">Amount ↑</option>
          </select>
        </label>
      </div>

      {showForm && (
        <div className="card" style={{marginBottom:12}}>
          <div className="card-header"><strong>Add loan</strong></div>
          <div className="card-body" style={{display:'grid',gap:8}}>
            <label>Lender: <input value={form.lender} onChange={(e)=>setForm({...form,lender:e.target.value})} /></label>
            <label>Amount borrowed: <input type="number" value={form.amount_borrowed} onChange={(e)=>setForm({...form,amount_borrowed:Number(e.target.value)})} /></label>
            <label>Interest %: <input type="number" step="0.01" value={form.interest_rate} onChange={(e)=>setForm({...form,interest_rate:Number(e.target.value)})} /></label>
            <label>Start date: <input type="date" value={form.start_date} onChange={(e)=>setForm({...form,start_date:e.target.value})} /></label>
            <label>Status:
              <select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})}>
                <option>Active</option>
                <option>Closed</option>
              </select>
            </label>
            <label>Notes: <input value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} /></label>
            <div><button className="btn accent" onClick={add}>Save</button></div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><strong>Ledger</strong></div>
        <div className="card-body">
          <table className="table">
            <thead><tr><th>Lender</th><th className="right">Borrowed</th><th className="right">Rate %</th><th>Start</th><th className="right">Principal Repaid</th><th className="right">Interest Paid</th><th className="right">Outstanding*</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(i => {
                const borrowed = Number((i.amount_borrowed ?? i.outflow) || 0);
                const stats = loanStats.get(i.id) || { principalRepaid: 0, interestPaid: 0, lastPaymentDate: null, rate: 0, startDate: todayISO() };
                const rate = Number(i.interest_rate || 0);
                
                // Calculate current outstanding with accrued interest
                const outstandingPrincipal = Math.max(0, borrowed - stats.principalRepaid);
                const lastDate = stats.lastPaymentDate || (i.start_date || i.date || todayISO()).slice(0, 10);
                const accruedInterest = rate > 0 && outstandingPrincipal > 0 
                  ? calculateAccruedInterest(outstandingPrincipal, rate, lastDate, todayISO())
                  : 0;
                const totalOutstanding = outstandingPrincipal + accruedInterest;
                
                return (
                  <tr key={i.id}>
                    <td>{i.lender || i.label}</td>
                    <td className="right">{fmt(borrowed)}</td>
                    <td className="right">{rate.toFixed(2)}%</td>
                    <td>{(i.start_date || i.date || '').slice(0,10)}</td>
                    <td className="right">{fmt(stats.principalRepaid)}</td>
                    <td className="right text-neg">{fmt(stats.interestPaid)}</td>
                    <td className="right" title={`Principal: ${fmt(outstandingPrincipal)} + Accrued Interest: ${fmt(accruedInterest)}`}>
                      {fmt(totalOutstanding)}
                    </td>
                    <td><span className={`pill ${totalOutstanding>0?'danger':'success'}`}>{i.status || (totalOutstanding>0?'Active':'Closed')}</span></td>
                    <td>
                      <button className="btn" onClick={()=>{ setPayLoan(i); setPayForm({ amount:'', date: todayISO(), notes:'' }); }}>Add payment</button>
                      <button className="btn" onClick={()=>{ setEdit(i); setError(''); }} style={{marginLeft:6}}>Edit</button>
                      <button className="btn danger" onClick={()=>remove(i.id)} style={{marginLeft:6}}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p style={{fontSize:'0.85em',color:'var(--finance-muted)',marginTop:8}}>
            * Outstanding = Principal + Accrued Interest (calculated daily from last payment date)
          </p>
        </div>
      </div>

      <SimpleModal open={!!edit} title="Edit Loan" onClose={()=>setEdit(null)}>
        {error && <p style={{color:'salmon'}}>{error}</p>}
        {edit && (
          <div style={{display:'grid',gap:8}}>
            <label>Lender: <input value={edit.lender || edit.label} onChange={(e)=>setEdit({...edit,lender:e.target.value})} /></label>
            <label>Amount borrowed: <input type="number" value={(edit.amount_borrowed ?? edit.outflow) || 0} onChange={(e)=>setEdit({...edit,amount_borrowed:Number(e.target.value)})} /></label>
            <label>Interest %: <input type="number" step="0.01" value={edit.interest_rate || 0} onChange={(e)=>setEdit({...edit,interest_rate:Number(e.target.value)})} /></label>
            <label>Start date: <input type="date" value={(edit.start_date || edit.date || '').slice(0,10)} onChange={(e)=>setEdit({...edit,start_date:e.target.value})} /></label>
            <label>Status:
              <select value={edit.status || 'Active'} onChange={(e)=>setEdit({...edit,status:e.target.value})}>
                <option>Active</option>
                <option>Closed</option>
              </select>
            </label>
            <label>Notes: <input value={edit.notes || ''} onChange={(e)=>setEdit({...edit,notes:e.target.value})} /></label>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="btn accent" onClick={saveEdit}>Save</button>
              <button className="btn" onClick={()=>setEdit(null)}>Cancel</button>
            </div>
          </div>
        )}
      </SimpleModal>

      <SimpleModal open={!!payLoan} title={payLoan ? `Add repayment — ${payLoan.lender || payLoan.label}` : 'Add repayment'} onClose={()=>setPayLoan(null)}>
        {error && <p style={{color:'salmon'}}>{error}</p>}
        {payLoan && (() => {
          const stats = loanStats.get(payLoan.id) || { principalRepaid: 0, interestPaid: 0, lastPaymentDate: null };
          const borrowed = Number((payLoan.amount_borrowed ?? payLoan.outflow) || 0);
          const rate = Number(payLoan.interest_rate || 0);
          const outstandingPrincipal = Math.max(0, borrowed - stats.principalRepaid);
          const lastDate = stats.lastPaymentDate || (payLoan.start_date || payLoan.date || todayISO()).slice(0, 10);
          
          // Calculate breakdown for preview
          const paymentAmount = Number(payForm.amount) || 0;
          const paymentDate = payForm.date || todayISO();
          let breakdown = { interest: 0, principal: paymentAmount };
          
          if (rate > 0 && outstandingPrincipal > 0 && paymentAmount > 0) {
            breakdown = calculatePaymentBreakdown(paymentAmount, outstandingPrincipal, rate, lastDate, paymentDate);
          }
          
          return (
            <div style={{display:'grid',gap:8}}>
              <div style={{padding:8,background:'rgba(255,255,255,0.05)',borderRadius:4,marginBottom:8}}>
                <div style={{fontSize:'0.85em',color:'var(--finance-muted)'}}>Current Outstanding</div>
                <div style={{fontSize:'1.1em',fontWeight:'bold'}}>{fmt(outstandingPrincipal)}</div>
                <div style={{fontSize:'0.85em',color:'var(--finance-muted)',marginTop:4}}>
                  Interest Rate: {rate.toFixed(2)}%
                </div>
              </div>
              
              <label>Amount: <input type="number" value={payForm.amount} onChange={(e)=>setPayForm({...payForm,amount:e.target.value})} /></label>
              <label>Date: <input type="date" value={payForm.date} onChange={(e)=>setPayForm({...payForm,date:e.target.value})} /></label>
              <label>Notes: <input value={payForm.notes} onChange={(e)=>setPayForm({...payForm,notes:e.target.value})} /></label>
              
              {paymentAmount > 0 && (
                <div style={{padding:8,background:'rgba(255,255,255,0.05)',borderRadius:4,fontSize:'0.9em'}}>
                  <div style={{fontWeight:'bold',marginBottom:4}}>Payment Breakdown:</div>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span>Principal:</span>
                    <span style={{color:'var(--finance-accent)'}}>{fmt(breakdown.principal)}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span>Interest:</span>
                    <span className="text-neg">{fmt(breakdown.interest)}</span>
                  </div>
                  <div style={{borderTop:'1px solid rgba(255,255,255,0.1)',marginTop:4,paddingTop:4,display:'flex',justifyContent:'space-between',fontWeight:'bold'}}>
                    <span>Total:</span>
                    <span>{fmt(paymentAmount)}</span>
                  </div>
                </div>
              )}
              
              <div style={{display:'flex',gap:8,marginTop:8}}>
                <button className="btn accent" onClick={addPayment}>Save</button>
                <button className="btn" onClick={()=>setPayLoan(null)}>Cancel</button>
              </div>
            </div>
          );
        })()}
      </SimpleModal>
    </FinanceLayout>
  );
}
