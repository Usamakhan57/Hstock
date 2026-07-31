/**
 * Money helpers — amounts stored as decimal numbers in USD ledger currency.
 * All math rounds to 2 decimal places to avoid floating drift.
 */

export function roundMoney(value, decimals = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  const factor = 10 ** decimals;
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

export function toMoneyString(value, decimals = 2) {
  return roundMoney(value, decimals).toFixed(decimals);
}

export function calculateCommission(amount, percent) {
  const base = roundMoney(amount);
  const rate = Number(percent);
  if (!Number.isFinite(rate) || rate <= 0) {
    return {
      commissionAmount: 0,
      sellerAmount: base,
      percent: 0,
    };
  }
  const commissionAmount = roundMoney((base * rate) / 100);
  const sellerAmount = roundMoney(base - commissionAmount);
  return {
    commissionAmount,
    sellerAmount,
    percent: rate,
  };
}

export function assertPositiveAmount(amount, field = 'amount') {
  const value = roundMoney(amount);
  if (!(value > 0)) {
    throw new Error(`${field} must be greater than zero`);
  }
  return value;
}

export default {
  roundMoney,
  toMoneyString,
  calculateCommission,
  assertPositiveAmount,
};
