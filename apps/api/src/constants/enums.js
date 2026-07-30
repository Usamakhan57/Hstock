/**
 * Central enums used across domain modules.
 * Values align with the approved architecture document + Phase 2 extensions.
 */

export const RoleEnum = Object.freeze({
  SuperAdmin: 'super_admin',
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

export const UserStatusEnum = Object.freeze({
  Active: 'active',
  Inactive: 'inactive',
  Suspended: 'suspended',
  Deleted: 'deleted',
  Pending: 'pending',
});

export const VerificationStatusEnum = Object.freeze({
  Unverified: 'unverified',
  Pending: 'pending',
  Verified: 'verified',
  Rejected: 'rejected',
});

export const SellerStatusEnum = Object.freeze({
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
  Suspended: 'suspended',
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
  UserStatusEnum,
  VerificationStatusEnum,
  SellerStatusEnum,
  EscrowStatusEnum,
  WithdrawalStatusEnum,
  PaymentStatusEnum,
};
