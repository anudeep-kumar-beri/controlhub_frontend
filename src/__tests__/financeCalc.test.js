import { calculateFD, aggregateMaster } from '../utils/finance/financeCalc';

describe('financeCalc.calculateFD', () => {
  test('returns principal when inputs missing', () => {
    expect(calculateFD({ amount: 1000 })).toEqual({ maturity_value: 1000, interest_earned: 0 });
  });
  test('computes maturity and interest', () => {
    const { maturity_value, interest_earned } = calculateFD({ amount: 100000, interest_rate: 6, tenure_months: 12, compounding: 4 });
    expect(maturity_value).toBeGreaterThan(100000);
    expect(interest_earned).toBe(maturity_value - 100000);
  });
});

describe('financeCalc.aggregateMaster', () => {
  test('sums inflow and outflow and computes net', () => {
    const res = aggregateMaster([
      { inflow: 100, outflow: 0 },
      { inflow: 0, outflow: 40 },
      { inflow: 60, outflow: 10 },
    ]);
    expect(res.inflow_total).toBe(160);
    expect(res.outflow_total).toBe(50);
    expect(res.net).toBe(110);
  });
});
