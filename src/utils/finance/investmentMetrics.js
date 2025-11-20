// investmentMetrics.js — extracted pure functions to enable testing & reuse
import { calculateFD } from './financeCalc';
import { todayISO } from '../format';

export function computePaperValue(inv) {
  const units = Number(inv.units || 0);
  const current = Number(inv.current_unit_price || 0);
  const principal = Number(inv.amount || 0) || 0;
  if (units > 0 && current > 0) {
    const paperValue = units * current;
    return { paperValue, paperPL: paperValue - principal };
  }
  return { paperValue: null, paperPL: null };
}

export function computeMaturityInfo(inv) {
  const type = String(inv.type||'').toUpperCase();
  const principal = Number(inv.amount || 0) || 0;
  if (['FD','RD','BOND'].includes(type)) {
    const rate = Number(inv.interest_rate || inv.rate || 0);
    const tenure = Number(inv.tenure_months || inv.tenure || 0);
    const compounding = Number(inv.compounding || 1) || 1;
    const fd = calculateFD({ amount: principal, interest_rate: rate, tenure_months: tenure, compounding });
    return { maturityValue: fd.maturity_value, interestEarned: fd.interest_earned };
  }
  // Non-deposit: use cashout if realized else paper
  if (inv.cashout_amount && inv.cashout_date) {
    return { maturityValue: Number(inv.cashout_amount||0), interestEarned: Number(inv.cashout_amount||0) - principal };
  }
  const { paperValue, paperPL } = computePaperValue(inv);
  return { maturityValue: paperValue || 0, interestEarned: paperPL || 0 };
}

export function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const dd = new Date(d.getTime());
  dd.setMonth(dd.getMonth() + (Number(months)||0));
  return dd.toISOString().slice(0,10);
}

export function computePortfolio(investments, today = todayISO()) {
  const allocation = new Map();
  let totalPrincipal = 0;
  let realizedPL = 0;
  let unrealizedPL = 0;
  const upcoming = { d30: [], d60: [], d90: [] };
  const now = new Date(today);
  for (const inv of investments||[]) {
    const type = (inv.type || 'OTHER').toUpperCase();
    const principal = Number(inv.amount || 0) || 0;
    totalPrincipal += principal;
    allocation.set(type, (allocation.get(type) || 0) + principal);
    const isFD = ['FD','RD','BOND'].includes(type);
    if (isFD) {
      const { maturityValue, interestEarned } = computeMaturityInfo(inv);
      const tenure = Number(inv.tenure_months || inv.tenure || 0);
      const start = (inv.start_date || inv.date || '').slice(0,10);
      const maturity = (inv.maturity_date && String(inv.maturity_date).slice(0,10)) || (start && tenure ? addMonths(start, tenure) : null);
      if (maturity && maturity <= today && ['Matured','CashedOut'].includes(inv.status)) {
        realizedPL += interestEarned;
      } else {
        unrealizedPL += interestEarned;
        if (maturity) {
          const matDate = new Date(maturity);
          const diffDays = Math.floor((matDate - now)/(1000*60*60*24));
          if (diffDays > 0 && diffDays <= 30) upcoming.d30.push(inv);
          else if (diffDays <= 60) upcoming.d60.push(inv);
          else if (diffDays <= 90) upcoming.d90.push(inv);
        }
      }
    } else {
      const { paperValue, paperPL } = computePaperValue(inv);
      if (inv.cashout_amount && inv.cashout_date && String(inv.cashout_date).slice(0,10) <= today && ['CashedOut','Matured'].includes(inv.status)) {
        realizedPL += (Number(inv.cashout_amount||0) - principal);
      } else if (paperPL !== null) {
        unrealizedPL += paperPL;
      }
    }
  }
  const allocationArr = Array.from(allocation.entries()).map(([t,v])=>({ type:t, value:v, pct: totalPrincipal ? (v/totalPrincipal*100) : 0 }));
  return { allocation: allocationArr, totalPrincipal, realizedPL, unrealizedPL, upcoming };
}
