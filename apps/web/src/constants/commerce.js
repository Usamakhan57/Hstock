/** Storefront commerce constants — display labels map to backend enums. */

export const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PAYMENT_PROCESSING: 'payment_processing',
  PAID: 'paid',
  ESCROW: 'escrow',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  DISPUTED: 'disputed',
  EXPIRED: 'expired',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  PAID: 'paid',
  PARTIAL: 'partial',
  FAILED: 'failed',
  EXPIRED: 'expired',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

export const ESCROW_STATUS = {
  PENDING: 'pending',
  LOCKED: 'locked',
  RELEASED: 'released',
  REFUNDED: 'refunded',
  DISPUTED: 'disputed',
};

export const WITHDRAWAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid',
  CANCELLED: 'cancelled',
};

/** Fallback display-only commission when buyer cannot read CommissionConfig. */
export const DEFAULT_COMMISSION_PERCENT = 10;

/** Compact checkout options (purchase modal). Withdrawals use WITHDRAW_CRYPTO_ASSETS. */
/** @deprecated Prefer dynamic checkout assets from paymentsApi.listCheckoutAssets() */
export const PAYMENT_CURRENCIES = [
  { coin: 'USDT', network: 'tron', label: 'USDT · TRC20' },
  { coin: 'USDT', network: 'eth', label: 'USDT · ERC20' },
  { coin: 'USDT', network: 'bsc', label: 'USDT · BEP20' },
  { coin: 'USDT', network: 'polygon', label: 'USDT · Polygon' },
  { coin: 'USDC', network: 'eth', label: 'USDC · ERC20' },
  { coin: 'BTC', network: 'btc', label: 'Bitcoin' },
  { coin: 'ETH', network: 'eth', label: 'Ethereum' },
  { coin: 'BNB', network: 'bsc', label: 'BNB · BEP20' },
  { coin: 'TRX', network: 'tron', label: 'TRX' },
  { coin: 'TON', network: 'ton', label: 'TON' },
  { coin: 'SOL', network: 'sol', label: 'Solana' },
  { coin: 'XRP', network: 'xrp', label: 'XRP' },
  { coin: 'DOGE', network: 'doge', label: 'DOGE' },
  { coin: 'LTC', network: 'ltc', label: 'Litecoin' },
  { coin: 'XMR', network: 'monero', label: 'Monero' },
];

export { WITHDRAW_CRYPTO_ASSETS } from './cryptoAssets';

export const ORDER_STATUS_LABEL = {
  pending_payment: 'Pending Payment',
  payment_processing: 'Processing',
  paid: 'Paid',
  escrow: 'Escrow',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  disputed: 'Disputed',
  expired: 'Expired',
};

export const PAYMENT_STATUS_LABEL = {
  pending: 'Pending',
  processing: 'Processing',
  paid: 'Paid',
  partial: 'Partial',
  failed: 'Failed',
  expired: 'Expired',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

export const ESCROW_STATUS_LABEL = {
  pending: 'Pending',
  locked: 'Held',
  released: 'Released',
  refunded: 'Refunded',
  disputed: 'Disputed',
};

export const WITHDRAWAL_STATUS_LABEL = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

export function formatMoney(value) {
  const n = Number(value) || 0;
  return Math.round(n * 100) / 100;
}

export function estimateCommission(subtotal, percent = DEFAULT_COMMISSION_PERCENT) {
  const amount = formatMoney(subtotal);
  const fee = formatMoney((amount * Number(percent || 0)) / 100);
  return {
    percent: Number(percent || 0),
    commissionAmount: fee,
    sellerAmount: formatMoney(amount - fee),
    totalAmount: amount,
  };
}
