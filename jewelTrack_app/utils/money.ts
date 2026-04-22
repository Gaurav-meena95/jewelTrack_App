/**
 * Standard utility for financial calculations and formatting.
 * For JewelTrack, we prioritize precision by rounding to the nearest Rupee
 * for final transaction values, while maintaining 3 decimal places for weights.
 */

/**
 * Rounds a number to the nearest integer (standard for Rupees in this app).
 */
export const roundMoney = (amount: number | string): number => {
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Math.round(val || 0);
};

/**
 * Formats a number as a currency string with Rupee symbol.
 */
export const formatCurrency = (amount: number | string): string => {
  const val = roundMoney(amount);
  return `₹ ${val.toLocaleString('en-IN')}`;
};

/**
 * Rounds weight to 3 decimal places (standard for jewelry).
 */
export const roundWeight = (weight: number | string): number => {
  const val = typeof weight === 'string' ? parseFloat(weight) : weight;
  return Math.round((val || 0) * 1000) / 1000;
};
