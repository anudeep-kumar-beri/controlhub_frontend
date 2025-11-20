import { computePaperValue, computeMaturityInfo, computePortfolio } from '../utils/finance/investmentMetrics';
import { calculateFD } from '../utils/finance/financeCalc';

describe('investmentMetrics.computePaperValue', () => {
  test('returns nulls when insufficient data', () => {
    expect(computePaperValue({})).toEqual({ paperValue: null, paperPL: null });
  });
  test('computes paper value and PL', () => {
    const res = computePaperValue({ units: 10, current_unit_price: 123.45, amount: 1000 });
    expect(res.paperValue).toBeCloseTo(1234.5);
    expect(res.paperPL).toBeCloseTo(234.5);
  });
});

describe('investmentMetrics.computeMaturityInfo (FD)', () => {
  test('matches calculateFD output for deposits', () => {
    const inv = { type: 'FD', amount: 50000, interest_rate: 6, tenure_months: 12, compounding: 4 };
    const ref = calculateFD({ amount: inv.amount, interest_rate: inv.interest_rate, tenure_months: inv.tenure_months, compounding: inv.compounding });
    const res = computeMaturityInfo(inv);
    expect(res.maturityValue).toBe(ref.maturity_value);
    expect(res.interestEarned).toBe(ref.interest_earned);
  });
});

describe('investmentMetrics.computeMaturityInfo (non-deposit cashout)', () => {
  test('returns realized cashout P&L', () => {
    const inv = { type: 'MF', amount: 1000, cashout_amount: 1200, cashout_date: '2025-11-20' };
    const res = computeMaturityInfo(inv);
    expect(res.maturityValue).toBe(1200);
    expect(res.interestEarned).toBe(200);
  });
});

describe('investmentMetrics.computePortfolio', () => {
  test('aggregates allocation and PL', () => {
    const today = '2025-11-20';
    const items = [
      { id:'a', type:'FD', amount:10000, interest_rate:6, tenure_months:12, compounding:1, start_date:'2025-01-01', status:'Running' },
      { id:'b', type:'MF', amount:5000, units:50, current_unit_price:120, unit_cost:100, status:'Running' },
      { id:'c', type:'MF', amount:4000, cashout_amount:4500, cashout_date:'2025-11-01', status:'CashedOut' }
    ];
    const pf = computePortfolio(items, today);
    // Allocation includes principal sums
    expect(pf.totalPrincipal).toBe(10000+5000+4000);
    // Realized PL should include cashout diff (4500-4000 = 500)
    expect(pf.realizedPL).toBeGreaterThanOrEqual(500);
    // Unrealized PL should include MF paper gains (50*120 - 5000 = 1000)
    expect(pf.unrealizedPL).toBeGreaterThanOrEqual(1000);
    expect(pf.allocation.find(a=>a.type==='FD')).toBeTruthy();
  });
});
