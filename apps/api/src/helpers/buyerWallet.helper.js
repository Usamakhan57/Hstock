import { roundMoney } from './money.helper.js';

export function assertNonNegative(balance, label = 'balance') {
  if (balance < -0.000001) {
    throw new Error(`Negative ${label} is not allowed`);
  }
}

export function creditAvailable(wallet, amount) {
  const value = roundMoney(amount);
  if (!(value > 0)) throw new Error('Credit amount must be positive');
  wallet.availableBalance = roundMoney((wallet.availableBalance || 0) + value);
  wallet.totalDeposited = roundMoney((wallet.totalDeposited || 0) + value);
  wallet.version = (wallet.version || 0) + 1;
  wallet.lastTransactionAt = new Date();
  assertNonNegative(wallet.availableBalance, 'availableBalance');
  return wallet;
}

export function creditPending(wallet, amount) {
  const value = roundMoney(amount);
  if (!(value > 0)) throw new Error('Credit amount must be positive');
  wallet.pendingBalance = roundMoney((wallet.pendingBalance || 0) + value);
  wallet.version = (wallet.version || 0) + 1;
  wallet.lastTransactionAt = new Date();
  assertNonNegative(wallet.pendingBalance, 'pendingBalance');
  return wallet;
}

export function releasePendingToAvailable(wallet, amount) {
  const value = roundMoney(amount);
  if (!(value > 0)) throw new Error('Amount must be positive');
  if ((wallet.pendingBalance || 0) + 1e-9 < value) {
    throw new Error('Insufficient pending balance');
  }
  wallet.pendingBalance = roundMoney((wallet.pendingBalance || 0) - value);
  wallet.availableBalance = roundMoney((wallet.availableBalance || 0) + value);
  wallet.totalDeposited = roundMoney((wallet.totalDeposited || 0) + value);
  wallet.version = (wallet.version || 0) + 1;
  wallet.lastTransactionAt = new Date();
  return wallet;
}

export function debitAvailable(wallet, amount) {
  const value = roundMoney(amount);
  if (!(value > 0)) throw new Error('Debit amount must be positive');
  if (wallet.frozen) throw new Error('Wallet is frozen');
  if ((wallet.availableBalance || 0) + 1e-9 < value) {
    throw new Error('Insufficient available balance');
  }
  wallet.availableBalance = roundMoney((wallet.availableBalance || 0) - value);
  wallet.totalSpent = roundMoney((wallet.totalSpent || 0) + value);
  wallet.version = (wallet.version || 0) + 1;
  wallet.lastTransactionAt = new Date();
  assertNonNegative(wallet.availableBalance, 'availableBalance');
  return wallet;
}

export function creditRefund(wallet, amount) {
  const value = roundMoney(amount);
  if (!(value > 0)) throw new Error('Refund amount must be positive');
  wallet.availableBalance = roundMoney((wallet.availableBalance || 0) + value);
  wallet.totalRefunded = roundMoney((wallet.totalRefunded || 0) + value);
  wallet.version = (wallet.version || 0) + 1;
  wallet.lastTransactionAt = new Date();
  return wallet;
}

export function applyAdjustment(wallet, amount, direction) {
  const value = roundMoney(amount);
  if (!(value > 0)) throw new Error('Adjustment amount must be positive');
  if (direction === 'debit') {
    if ((wallet.availableBalance || 0) + 1e-9 < value) {
      throw new Error('Insufficient available balance');
    }
    wallet.availableBalance = roundMoney((wallet.availableBalance || 0) - value);
  } else {
    wallet.availableBalance = roundMoney((wallet.availableBalance || 0) + value);
  }
  wallet.version = (wallet.version || 0) + 1;
  wallet.lastTransactionAt = new Date();
  assertNonNegative(wallet.availableBalance, 'availableBalance');
  return wallet;
}

export default {
  creditAvailable,
  creditPending,
  releasePendingToAvailable,
  debitAvailable,
  creditRefund,
  applyAdjustment,
};
