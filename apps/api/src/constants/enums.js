/**
 * Central enums used across future domain modules.
 * Values align with the approved architecture document.
 */

export const RoleEnum = Object.freeze({
  Admin: 'admin',
  Buyer: 'buyer',
  Seller: 'seller',
  Editor: 'editor',
  Support: 'support',
});

export const StatusEnum = Object.freeze({
  Pending: 'Pending',
  Completed: 'Completed',
  Rejected: 'Rejected',
  Paid: 'Paid',
  Released: 'Released',
  Disputed: 'Disputed',
  Cancelled: 'Cancelled',
});

export const EscrowStatusEnum = Object.freeze({
  None: 'None',
  Held: 'Held',
  Released: 'Released',
  Disputed: 'Disputed',
  Refunded: 'Refunded',
});

export const WithdrawalStatusEnum = Object.freeze({
  Pending: 'Pending',
  Paid: 'Paid',
  Rejected: 'Rejected',
});

export const PaymentStatusEnum = Object.freeze({
  AwaitingPayment: 'awaiting_payment',
  Paid: 'paid',
  Failed: 'failed',
  Expired: 'expired',
  Refunded: 'refunded',
});

export default {
  RoleEnum,
  StatusEnum,
  EscrowStatusEnum,
  WithdrawalStatusEnum,
  PaymentStatusEnum,
};
