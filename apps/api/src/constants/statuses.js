/**
 * Commerce domain statuses — single source of truth for Order / Payment / Escrow /
 * Withdrawal / Dispute / Refund / Delivery / Ledger.
 */

export const ORDER_STATUS = Object.freeze({
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
});

export const ORDER_STATUS_VALUES = Object.freeze(Object.values(ORDER_STATUS));

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  PAID: 'paid',
  PARTIAL: 'partial',
  FAILED: 'failed',
  EXPIRED: 'expired',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
});

export const PAYMENT_STATUS_VALUES = Object.freeze(Object.values(PAYMENT_STATUS));

export const ESCROW_STATUS = Object.freeze({
  PENDING: 'pending',
  LOCKED: 'locked',
  RELEASED: 'released',
  REFUNDED: 'refunded',
  DISPUTED: 'disputed',
});

export const ESCROW_STATUS_VALUES = Object.freeze(Object.values(ESCROW_STATUS));

export const WITHDRAWAL_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid',
  CANCELLED: 'cancelled',
});

export const WITHDRAWAL_STATUS_VALUES = Object.freeze(Object.values(WITHDRAWAL_STATUS));

export const DISPUTE_STATUS = Object.freeze({
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  WAITING_FOR_BUYER_CONFIRMATION: 'waiting_for_buyer_confirmation',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
});

export const DISPUTE_STATUS_VALUES = Object.freeze(Object.values(DISPUTE_STATUS));

export const DISPUTE_RESOLUTION = Object.freeze({
  SELLER_WINS: 'seller_wins',
  BUYER_WINS: 'buyer_wins',
  PARTIAL_REFUND: 'partial_refund',
  RELEASE: 'release',
});

export const DISPUTE_RESOLUTION_VALUES = Object.freeze(Object.values(DISPUTE_RESOLUTION));

export const REFUND_STATUS = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
});

export const REFUND_STATUS_VALUES = Object.freeze(Object.values(REFUND_STATUS));

export const REFUND_TYPE = Object.freeze({
  FULL: 'full',
  PARTIAL: 'partial',
  MANUAL: 'manual',
  ESCROW: 'escrow',
});

export const REFUND_TYPE_VALUES = Object.freeze(Object.values(REFUND_TYPE));

export const DELIVERY_STATUS = Object.freeze({
  PENDING: 'pending',
  AWAITING_DELIVERY: 'awaiting_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
});

export const DELIVERY_STATUS_VALUES = Object.freeze(Object.values(DELIVERY_STATUS));

export const WEBHOOK_EVENT_STATUS = Object.freeze({
  RECEIVED: 'received',
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  FAILED: 'failed',
  DUPLICATE: 'duplicate',
  REJECTED: 'rejected',
});

export const WEBHOOK_EVENT_STATUS_VALUES = Object.freeze(Object.values(WEBHOOK_EVENT_STATUS));

export const GENERIC_STATUS = Object.freeze({
  PENDING: 'pending',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  PAID: 'paid',
  RELEASED: 'released',
  DISPUTED: 'disputed',
  CANCELLED: 'cancelled',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  APPROVED: 'approved',
});

export default {
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS,
  PAYMENT_STATUS_VALUES,
  ESCROW_STATUS,
  ESCROW_STATUS_VALUES,
  WITHDRAWAL_STATUS,
  WITHDRAWAL_STATUS_VALUES,
  DISPUTE_STATUS,
  DISPUTE_STATUS_VALUES,
  DISPUTE_RESOLUTION,
  DISPUTE_RESOLUTION_VALUES,
  REFUND_STATUS,
  REFUND_STATUS_VALUES,
  REFUND_TYPE,
  REFUND_TYPE_VALUES,
  DELIVERY_STATUS,
  DELIVERY_STATUS_VALUES,
  WEBHOOK_EVENT_STATUS,
  WEBHOOK_EVENT_STATUS_VALUES,
  GENERIC_STATUS,
};
