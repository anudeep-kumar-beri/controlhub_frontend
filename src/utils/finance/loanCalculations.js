/**
 * Loan interest calculation utilities
 */

/**
 * Calculate simple interest
 * @param {number} principal - Principal amount
 * @param {number} ratePercent - Annual interest rate (e.g., 12 for 12%)
 * @param {number} days - Number of days
 * @returns {number} Interest amount
 */
export function calculateSimpleInterest(principal, ratePercent, days) {
  return (principal * ratePercent * days) / (365 * 100);
}

/**
 * Calculate interest accrued between two dates
 * @param {number} principal - Outstanding principal
 * @param {number} ratePercent - Annual interest rate
 * @param {string} fromDate - Start date (YYYY-MM-DD)
 * @param {string} toDate - End date (YYYY-MM-DD)
 * @returns {number} Accrued interest
 */
export function calculateAccruedInterest(principal, ratePercent, fromDate, toDate) {
  if (!principal || !ratePercent) return 0;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const days = Math.max(0, Math.floor((to - from) / (1000 * 60 * 60 * 24)));
  return calculateSimpleInterest(principal, ratePercent, days);
}

/**
 * Calculate EMI breakdown (principal vs interest)
 * @param {number} payment - Total payment amount
 * @param {number} outstandingPrincipal - Current outstanding principal
 * @param {number} ratePercent - Annual interest rate
 * @param {string} lastDate - Date of last payment or loan start
 * @param {string} currentDate - Current payment date
 * @returns {{principal: number, interest: number}}
 */
export function calculatePaymentBreakdown(payment, outstandingPrincipal, ratePercent, lastDate, currentDate) {
  // Calculate interest accrued since last payment
  const accruedInterest = calculateAccruedInterest(outstandingPrincipal, ratePercent, lastDate, currentDate);
  
  // Interest is paid first, remainder goes to principal
  const interestPaid = Math.min(payment, accruedInterest);
  const principalPaid = Math.max(0, payment - interestPaid);
  
  return {
    interest: Math.round(interestPaid * 100) / 100,
    principal: Math.round(principalPaid * 100) / 100
  };
}

/**
 * Calculate total interest payable on a loan
 * @param {number} principal - Loan principal
 * @param {number} ratePercent - Annual interest rate
 * @param {number} tenureMonths - Loan tenure in months
 * @param {number} emiAmount - Monthly EMI amount (optional, for reducing balance)
 * @returns {number} Total interest
 */
export function calculateTotalInterest(principal, ratePercent, tenureMonths, emiAmount = null) {
  if (!emiAmount) {
    // Simple interest for flat rate loans
    return (principal * ratePercent * tenureMonths) / (12 * 100);
  }
  
  // Reducing balance - simulate month by month
  let outstanding = principal;
  let totalInterest = 0;
  
  for (let i = 0; i < tenureMonths && outstanding > 0; i++) {
    const monthlyInterest = (outstanding * ratePercent) / (12 * 100);
    totalInterest += monthlyInterest;
    outstanding -= Math.max(0, emiAmount - monthlyInterest);
  }
  
  return Math.round(totalInterest * 100) / 100;
}

/**
 * Calculate current outstanding with accrued interest
 * @param {number} borrowed - Original borrowed amount
 * @param {number} principalRepaid - Total principal repaid
 * @param {number} interestPaid - Total interest paid
 * @param {number} ratePercent - Annual interest rate
 * @param {string} lastPaymentDate - Date of last payment or loan start
 * @param {string} currentDate - Current date for accrual calculation
 * @returns {{principal: number, accruedInterest: number, total: number}}
 */
export function calculateCurrentOutstanding(borrowed, principalRepaid, interestPaid, ratePercent, lastPaymentDate, currentDate) {
  const outstandingPrincipal = Math.max(0, borrowed - principalRepaid);
  const accruedInterest = calculateAccruedInterest(outstandingPrincipal, ratePercent, lastPaymentDate, currentDate);
  
  return {
    principal: Math.round(outstandingPrincipal * 100) / 100,
    accruedInterest: Math.round(accruedInterest * 100) / 100,
    total: Math.round((outstandingPrincipal + accruedInterest) * 100) / 100
  };
}
