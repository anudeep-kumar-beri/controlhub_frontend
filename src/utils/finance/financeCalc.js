// financeCalc.js — placeholder for aggregation and formulas
// Minimal skeleton so other modules can import without crashing.

export function calculateFD({ amount, interest_rate, tenure_months, compounding = 1 }) {
  if (!amount || !interest_rate || !tenure_months) return { maturity_value: amount || 0, interest_earned: 0 };
  const years = tenure_months / 12;
  const r = (interest_rate / 100) / compounding;
  const maturity = amount * Math.pow(1 + r, compounding * years);
  return { maturity_value: Math.round(maturity), interest_earned: Math.round(maturity - amount) };
}

export function aggregateMaster(rows = []) {
  // rows: { inflow, outflow }
  let inflow = 0; let outflow = 0;
  for (const r of rows) { inflow += r.inflow || 0; outflow += r.outflow || 0; }
  return { inflow_total: inflow, outflow_total: outflow, net: inflow - outflow };
}
