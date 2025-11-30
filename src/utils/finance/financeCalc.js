// financeCalc.js — placeholder for aggregation and formulas
// Minimal skeleton so other modules can import without crashing.

export function calculateFD({ amount, interest_rate, tenure_months, compounding = 1, interest_payout_method = 'at_maturity' }) {
  if (!amount || !interest_rate || !tenure_months) return { maturity_value: amount || 0, interest_earned: 0, periodic_payout: 0, total_periodic_payouts: 0 };
  
  const principal = Number(amount);
  const rate = Number(interest_rate);
  const tenure = Number(tenure_months);
  
  // At Maturity (Cumulative) - Interest compounds and paid at maturity
  if (interest_payout_method === 'at_maturity') {
    const years = tenure / 12;
    const r = (rate / 100) / compounding;
    const maturity = principal * Math.pow(1 + r, compounding * years);
    return { 
      maturity_value: Math.round(maturity), 
      interest_earned: Math.round(maturity - principal),
      periodic_payout: 0,
      total_periodic_payouts: 0
    };
  }
  
  // Periodic Payout (Non-Cumulative) - Interest paid periodically, principal returned at maturity
  let periodsPerYear = 12; // monthly by default
  if (interest_payout_method === 'quarterly') periodsPerYear = 4;
  else if (interest_payout_method === 'annual') periodsPerYear = 1;
  
  // Simple interest per period
  const periodicRate = rate / 100 / periodsPerYear;
  const periodicPayout = Math.round(principal * periodicRate);
  const totalPeriods = Math.floor(tenure / (12 / periodsPerYear));
  const totalPeriodicPayouts = periodicPayout * totalPeriods;
  
  return {
    maturity_value: principal, // Only principal returned at maturity
    interest_earned: totalPeriodicPayouts, // Total interest paid over tenure
    periodic_payout: periodicPayout, // Interest per period
    total_periodic_payouts: totalPeriodicPayouts
  };
}

export function aggregateMaster(rows = []) {
  // rows: { inflow, outflow }
  let inflow = 0; let outflow = 0;
  for (const r of rows) { inflow += r.inflow || 0; outflow += r.outflow || 0; }
  return { inflow_total: inflow, outflow_total: outflow, net: inflow - outflow };
}
