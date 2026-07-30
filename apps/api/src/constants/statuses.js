export const ORDER_STATUS = Object.freeze({
  AWAITING_PAYMENT: 'AwaitingPayment',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  DISPUTED: 'Disputed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  EXPIRED: 'Expired',
  PENDING: 'Pending',
  REJECTED: 'Rejected',
});

export const PAYMENT_STATUS = Object.freeze({
  AWAITING_PAYMENT: 'awaiting_payment',
  PAID: 'paid',
  PARTIAL: 'partial',
  FAILED: 'failed',
  EXPIRED: 'expired',
  REFUNDED: 'refunded',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
});

export const ESCROW_STATUS = Object.freeze({
  NONE: 'None',
  HELD: 'Held',
  RELEASED: 'Released',
  DISPUTED: 'Disputed',
  REFUNDED: 'Refunded',
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
});

export const WITHDRAWAL_STATUS = Object.freeze({
  PENDING: 'Pending',
  PAID: 'Paid',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
});

export const DELIVERY_STATUS = Object.freeze({
  AWAITING_DELIVERY: 'Awaiting Delivery',
  DELIVERED: 'Delivered',
  PENDING: 'Pending',
  CANCELLED: 'Cancelled',
});

export const GENERIC_STATUS = Object.freeze({
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  PAID: 'Paid',
  RELEASED: 'Released',
  DISPUTED: 'Disputed',
  CANCELLED: 'Cancelled',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  APPROVED: 'approved',
});

export default {
  ORDER_STATUS,
  PAYMENT_STATUS,
  ESCROW_STATUS,
  WITHDRAWAL_STATUS,
  DELIVERY_STATUS,
  GENERIC_STATUS,
};
