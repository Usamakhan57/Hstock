/**
 * Central enums used across domain modules.
 * Values align with the approved architecture document + Commerce Core.
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
  Pending: 'pending',
  Completed: 'completed',
  Rejected: 'rejected',
  Paid: 'paid',
  Released: 'released',
  Disputed: 'disputed',
  Cancelled: 'cancelled',
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
  Pending: 'pending',
  Locked: 'locked',
  Released: 'released',
  Refunded: 'refunded',
  Disputed: 'disputed',
});

export const WithdrawalStatusEnum = Object.freeze({
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
  Paid: 'paid',
  Cancelled: 'cancelled',
});

export const PaymentStatusEnum = Object.freeze({
  Pending: 'pending',
  Processing: 'processing',
  Paid: 'paid',
  Partial: 'partial',
  Failed: 'failed',
  Expired: 'expired',
  Refunded: 'refunded',
  Cancelled: 'cancelled',
});

export const DisputeStatusEnum = Object.freeze({
  Open: 'open',
  UnderReview: 'under_review',
  WaitingForBuyerConfirmation: 'waiting_for_buyer_confirmation',
  Resolved: 'resolved',
  Closed: 'closed',
});

export const DisputeResolutionEnum = Object.freeze({
  SellerWins: 'seller_wins',
  BuyerWins: 'buyer_wins',
  PartialRefund: 'partial_refund',
  Release: 'release',
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
  DisputeStatusEnum,
  DisputeResolutionEnum,
};
