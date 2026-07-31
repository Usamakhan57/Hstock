import { roundMoney } from './money.helper.js';
import {
  COIN_NETWORK_MAP,
  NETWORK_ADDRESS_PATTERNS,
  SUPPORTED_COINS,
  CRYPTOMUS_NETWORKS,
} from '../constants/coins.js';

/**
 * Recompute withdrawable balance from available - reserved.
 */
export function computeWithdrawable(availableBalance, reservedBalance) {
  return roundMoney(Math.max(0, roundMoney(availableBalance) - roundMoney(reservedBalance)));
}

export function isSupportedCoin(coin) {
  return SUPPORTED_COINS.includes(String(coin || '').toUpperCase());
}

export function isSupportedNetwork(network) {
  return CRYPTOMUS_NETWORKS.includes(String(network || '').toUpperCase());
}

export function isCoinNetworkCompatible(coin, network) {
  const c = String(coin || '').toUpperCase();
  const n = String(network || '').toUpperCase();
  const allowed = COIN_NETWORK_MAP[c];
  if (!allowed) return false;
  return allowed.includes(n);
}

export function validateWalletAddress(network, address) {
  const n = String(network || '').toUpperCase();
  const value = String(address || '').trim();
  if (!value || value.length < 10 || value.length > 256) {
    return { valid: false, reason: 'Wallet address length is invalid' };
  }
  const pattern = NETWORK_ADDRESS_PATTERNS[n];
  if (!pattern) {
    // Unknown network pattern — accept non-empty trimmed address
    return { valid: true };
  }
  if (!pattern.test(value)) {
    return { valid: false, reason: `Wallet address format is invalid for network ${n}` };
  }
  return { valid: true };
}

export function applyWalletCredit(walletDoc, amount) {
  const credit = roundMoney(amount);
  walletDoc.availableBalance = roundMoney(walletDoc.availableBalance + credit);
  walletDoc.releasedBalance = roundMoney(walletDoc.releasedBalance + credit);
  walletDoc.withdrawableBalance = computeWithdrawable(
    walletDoc.availableBalance,
    walletDoc.reservedBalance,
  );
  walletDoc.lastTransactionAt = new Date();
  walletDoc.version = (walletDoc.version || 0) + 1;
  return walletDoc;
}

export function applyPendingCredit(walletDoc, amount) {
  const credit = roundMoney(amount);
  walletDoc.pendingBalance = roundMoney(walletDoc.pendingBalance + credit);
  walletDoc.lastTransactionAt = new Date();
  walletDoc.version = (walletDoc.version || 0) + 1;
  return walletDoc;
}

export function applyPendingDebit(walletDoc, amount) {
  const debit = roundMoney(amount);
  walletDoc.pendingBalance = roundMoney(Math.max(0, walletDoc.pendingBalance - debit));
  walletDoc.lastTransactionAt = new Date();
  walletDoc.version = (walletDoc.version || 0) + 1;
  return walletDoc;
}

export function reserveWithdrawal(walletDoc, amount) {
  const value = roundMoney(amount);
  if (computeWithdrawable(walletDoc.availableBalance, walletDoc.reservedBalance) < value) {
    throw new Error('Insufficient withdrawable balance');
  }
  walletDoc.reservedBalance = roundMoney(walletDoc.reservedBalance + value);
  walletDoc.availableBalance = roundMoney(walletDoc.availableBalance - value);
  walletDoc.withdrawableBalance = computeWithdrawable(
    walletDoc.availableBalance,
    walletDoc.reservedBalance,
  );
  walletDoc.lastTransactionAt = new Date();
  walletDoc.version = (walletDoc.version || 0) + 1;
  return walletDoc;
}

export function releaseWithdrawalReserve(walletDoc, amount) {
  const value = roundMoney(amount);
  walletDoc.reservedBalance = roundMoney(Math.max(0, walletDoc.reservedBalance - value));
  walletDoc.availableBalance = roundMoney(walletDoc.availableBalance + value);
  walletDoc.withdrawableBalance = computeWithdrawable(
    walletDoc.availableBalance,
    walletDoc.reservedBalance,
  );
  walletDoc.lastTransactionAt = new Date();
  walletDoc.version = (walletDoc.version || 0) + 1;
  return walletDoc;
}

export function finalizeWithdrawalDebit(walletDoc, amount) {
  const value = roundMoney(amount);
  walletDoc.reservedBalance = roundMoney(Math.max(0, walletDoc.reservedBalance - value));
  walletDoc.totalWithdrawn = roundMoney(walletDoc.totalWithdrawn + value);
  walletDoc.withdrawableBalance = computeWithdrawable(
    walletDoc.availableBalance,
    walletDoc.reservedBalance,
  );
  walletDoc.lastTransactionAt = new Date();
  walletDoc.version = (walletDoc.version || 0) + 1;
  return walletDoc;
}

export default {
  computeWithdrawable,
  isSupportedCoin,
  isSupportedNetwork,
  isCoinNetworkCompatible,
  validateWalletAddress,
  applyWalletCredit,
  applyPendingCredit,
  applyPendingDebit,
  reserveWithdrawal,
  releaseWithdrawalReserve,
  finalizeWithdrawalDebit,
};
