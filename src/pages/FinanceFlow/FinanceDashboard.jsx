import React, { useEffect, useMemo, useState } from 'react';
import FinanceLayout from '../../components/finance/FinanceLayout.jsx';
import { startBackgroundSync } from '../../sync/financeSync';
import { getDashboardTotals, listInvestments, getMasterTransactions } from '../../db/stores/financeStore';
import { useCurrencyFormatter } from '../../utils/format';
import { Pie, Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

export default function FinanceDashboard() {
  const [period, setPeriod] = useState('this_month');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [totals, setTotals] = useState({ totalInvested: 0, totalIncome: 0, totalExpenses: 0, currentLiabilities: 0, netWorth: 0, netPL: 0 });
  const fmt = useCurrencyFormatter();
  const [alloc, setAlloc] = useState({ labels: [], values: [] });
  const [series, setSeries] = useState({ months: [], income: [], expenses: [], pnl: [] });
  const [dailyExp, setDailyExp] = useState({ days: [], totals: [], monthKey: '' });

  useEffect(() => {
    // Start background sync (best-effort)
    startBackgroundSync();
  }, []);
  useEffect(() => {
    (async () => {
      let fromDate = null, toDate = null;
      const now = new Date();
      if (period === 'this_month') {
        const y = now.getFullYear(); const m = String(now.getMonth()+1).padStart(2,'0');
        fromDate = `${y}-${m}-01`; toDate = new Date(y, now.getMonth()+1, 0).toISOString().slice(0,10);
      } else if (period === 'this_year') {
        const y = now.getFullYear(); fromDate = `${y}-01-01`; toDate = `${y}-12-31`;
      } else if (period === 'custom') {
        fromDate = custom.from || null; toDate = custom.to || null;
      }
      const t = await getDashboardTotals({ fromDate, toDate });
      setTotals(t);

      // Portfolio allocation (overall, by type)
      const inv = await listInvestments();
      const byType = new Map();
      for (const r of inv||[]) {
        const k = (r.type || 'Other');
        byType.set(k, (byType.get(k)||0) + Number(r.amount||0));
      }
      const labels = Array.from(byType.keys());
      const values = labels.map(k => byType.get(k));
      setAlloc({ labels, values });

      // Build monthly series for line/bar — default to last 12 months window or constrained by selected period if provided
      // Determine a range for series: if custom/this_year, respect; else last 12 months
      let rangeStart, rangeEnd;
      if (fromDate && toDate) { rangeStart = fromDate; rangeEnd = toDate; }
      else {
        const end = new Date();
        const start = new Date(end.getFullYear(), end.getMonth()-11, 1);
        rangeStart = `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-01`;
        rangeEnd = new Date(end.getFullYear(), end.getMonth()+1, 0).toISOString().slice(0,10);
      }
      const tx = await getMasterTransactions({ fromDate: rangeStart, toDate: rangeEnd });
      // month buckets
      function monthKey(d){ const dd = new Date(d); return `${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}`; }
      const monthsSet = new Set();
      const incomeByMonth = new Map();
      const expenseByMonth = new Map();
      const pnlByMonth = new Map();
      for (const r of tx) {
        const mk = monthKey(r.date);
        monthsSet.add(mk);
        if (r.source?.store === 'income') incomeByMonth.set(mk, (incomeByMonth.get(mk)||0) + (Number(r.inflow)||0));
        if (r.source?.store === 'expenses') expenseByMonth.set(mk, (expenseByMonth.get(mk)||0) + (Number(r.outflow)||0));
        pnlByMonth.set(mk, (pnlByMonth.get(mk)||0) + ((Number(r.inflow)||0) - (Number(r.outflow)||0)));
      }
      const monthsArr = Array.from(monthsSet).sort();
      // Ensure continuous months
      function enumerateMonths(start, end){
        const out = []; const s = new Date(start+"-01"); const e = new Date(end+"-01");
        s.setDate(1);
        while (s <= e) { out.push(`${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}`); s.setMonth(s.getMonth()+1); }
        return out;
      }
      const rangeMonths = enumerateMonths(monthsArr[0] || monthKey(rangeStart), monthsArr[monthsArr.length-1] || monthKey(rangeEnd));
      setSeries({
        months: rangeMonths,
        income: rangeMonths.map(m => incomeByMonth.get(m)||0),
        expenses: rangeMonths.map(m => expenseByMonth.get(m)||0),
        pnl: rangeMonths.map(m => pnlByMonth.get(m)||0)
      });

      // Expense heatmap for current month
      const now2 = new Date();
      const y = now2.getFullYear(); const m = now2.getMonth();
      const from = `${y}-${String(m+1).padStart(2,'0')}-01`;
      const to = new Date(y, m+1, 0).toISOString().slice(0,10);
      const txMonth = await getMasterTransactions({ fromDate: from, toDate: to });
      const byDay = new Map();
      for (const r of txMonth) {
        if (r.source?.store === 'expenses') {
          const d = r.date;
          byDay.set(d, (byDay.get(d)||0) + (Number(r.outflow)||0));
        }
      }
      const days = []; const totals = [];
      for (let day=1; day<= new Date(y, m+1, 0).getDate(); day++){
        const key = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        days.push(key); totals.push(byDay.get(key)||0);
      }
      setDailyExp({ days, totals, monthKey: `${y}-${String(m+1).padStart(2,'0')}` });
    })();
  }, [period, custom.from, custom.to]);

  const donutData = useMemo(()=>({
    labels: alloc.labels,
    datasets: [{ data: alloc.values, backgroundColor: ['#00e1c7','#7b61ff','#ffb020','#ff6b6b','#4dd0e1','#26a69a'] }]
  }), [alloc]);

  const lineData = useMemo(()=>({
    labels: series.months,
    datasets: [
      { label: 'Income', data: series.income, fill: false, borderColor: '#26a69a', backgroundColor:'#26a69a', tension: 0.2 },
      { label: 'Expenses', data: series.expenses, fill: false, borderColor: '#ff6b6b', backgroundColor:'#ff6b6b', tension: 0.2 }
    ]
  }), [series]);

  const barData = useMemo(()=>({
    labels: series.months,
    datasets: [{ label: 'Net P&L', data: series.pnl, backgroundColor: series.pnl.map(v=> v>=0 ? 'rgba(38,166,154,0.6)' : 'rgba(255,107,107,0.6)') }]
  }), [series]);

  function HeatmapCalendar({ days, totals, monthKey }){
    const max = Math.max(1, ...totals);
    return (
      <div>
        <div className="kpi-label" style={{marginBottom:6,color:'var(--finance-muted)'}}>Expense heatmap — {monthKey}</div>
        <div className="heatmap-grid">
          {days.map((d, idx)=>{
            const val = totals[idx]||0;
            const intensity = val / max; // 0..1
            const bg = `rgba(255,107,107,${0.12 + intensity*0.6})`;
            const border = '1px solid rgba(255,255,255,0.06)';
            return (
              <div key={d} className="heatmap-cell" title={`${d}: ${fmt(val)}`} style={{ background: bg, border }} />
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <FinanceLayout title="FinanceFlow — Dashboard">
      <div className="toolbar" style={{marginBottom:12}}>
        <label style={{color:'var(--finance-text)'}}>Period:
          <select value={period} onChange={(e)=>setPeriod(e.target.value)}>
            <option value="this_month">This month</option>
            <option value="this_year">This year</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        {period === 'custom' && (
          <>
            <label style={{color:'var(--finance-text)'}}>From: <input type="date" value={custom.from} onChange={(e)=>setCustom(c=>({...c,from:e.target.value}))} /></label>
            <label style={{color:'var(--finance-text)'}}>To: <input type="date" value={custom.to} onChange={(e)=>setCustom(c=>({...c,to:e.target.value}))} /></label>
          </>
        )}
      </div>
      <div className="dash-grid">
        {/* KPI compact tiles */}
        <div className="tile span-12">
          <div className="tile-body">
            <div className="kpi-grid">
              <div className="kpi-compact"><div className="kpi-label">Total Invested</div><div className="kpi-value">{fmt(totals.totalInvested)}</div></div>
              <div className="kpi-compact"><div className="kpi-label">Total Income</div><div className="kpi-value">{fmt(totals.totalIncome)}</div></div>
              <div className="kpi-compact"><div className="kpi-label">Total Expenses</div><div className="kpi-value">{fmt(totals.totalExpenses)}</div></div>
              <div className="kpi-compact"><div className="kpi-label">Current Liabilities</div><div className="kpi-value">{fmt(totals.currentLiabilities)}</div></div>
              <div className="kpi-compact"><div className="kpi-label">Net Worth</div><div className="kpi-value text-pos">{fmt(totals.netWorth)}</div></div>
              <div className="kpi-compact"><div className="kpi-label">Net P&L</div><div className={`kpi-value ${totals.netPL>=0?'text-pos':'text-neg'}`}>{fmt(totals.netPL)}</div></div>
            </div>
          </div>
        </div>

        {/* Charts layout */}
        <div className="tile span-4">
          <div className="tile-header">Portfolio allocation</div>
          <div className="tile-body">
            {alloc.labels.length ? (<div style={{maxWidth:420}}><Pie data={donutData} /></div>) : (<p className="muted">No investments yet.</p>)}
          </div>
        </div>
        <div className="tile span-8">
          <div className="tile-header">Income vs Expenses (monthly)</div>
          <div className="tile-body">
            {series.months.length ? (<div style={{width:'100%', maxWidth:900}}><Line data={lineData} options={{ plugins:{ legend:{ labels:{ color:'#cbd5e1' } }}, scales:{ x:{ ticks:{ color:'#9aa3b2' } }, y:{ ticks:{ color:'#9aa3b2' } } } }} /></div>) : (<p className="muted">Not enough data.</p>)}
          </div>
        </div>

        <div className="tile span-8">
          <div className="tile-header">Monthly Net P&L</div>
          <div className="tile-body">
            {series.months.length ? (<div style={{width:'100%', maxWidth:900}}><Bar data={barData} options={{ plugins:{ legend:{ display:false }}, scales:{ x:{ ticks:{ color:'#9aa3b2' } }, y:{ ticks:{ color:'#9aa3b2' } } } }} /></div>) : (<p className="muted">Not enough data.</p>)}
          </div>
        </div>
        <div className="tile span-4">
          <div className="tile-header">Expense heatmap</div>
          <div className="tile-body">
            {dailyExp.days.length ? (<HeatmapCalendar days={dailyExp.days} totals={dailyExp.totals} monthKey={dailyExp.monthKey} />) : (<p className="muted">No expenses yet for this month.</p>)}
          </div>
        </div>
      </div>
    </FinanceLayout>
  );
}
