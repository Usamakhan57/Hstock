/**
 * Marketplace notification types visible to buyers and sellers.
 * Auth / audit / debug events must never appear in this list.
 */
export const MARKETPLACE_NOTIFICATION_TYPES = Object.freeze([
  'order_created',
  'payment_success',
  'payment_failed',
  'escrow_released',
  'escrow_locked',
  'withdrawal_requested',
  'withdrawal_approved',
  'withdrawal_rejected',
  'withdrawal_paid',
  'dispute_opened',
  'dispute_updated',
  'dispute_resolved',
  'dispute_message',
  'refund_approved',
  'refund_completed',
  'replacement_requested',
  'replacement_accepted',
  'replacement_rejected',
  'product_moderated',
  'system',
  'purchase',
  'delivery',
  'message',
  'announcement',
  'wallet_deposit',
  'wallet_topup',
  'wallet_purchase',
  'wallet_refund',
  'wallet_adjustment',
  'wallet_frozen',
  'wallet_unfrozen',
  'store_promotion',
  'inventory_low',
  'review',
]);

/** Auth-adjacent types that may exist in the Notification collection historically. */
export const HIDDEN_NOTIFICATION_TYPES = Object.freeze([
  'registration',
  'verification',
  'password_reset',
]);

const HIDDEN_ACTIVITY_PREFIXES = Object.freeze([
  'auth.',
  'users.password.',
  'users.login.',
  'users.logout.',
  'system.debug.',
  'system.audit.',
  'developer.',
]);

export function isHiddenActivityAction(action) {
  const value = String(action || '').toLowerCase();
  if (!value) return false;
  return HIDDEN_ACTIVITY_PREFIXES.some((prefix) => value.startsWith(prefix));
}

export function isMarketplaceNotificationType(type) {
  return MARKETPLACE_NOTIFICATION_TYPES.includes(String(type || ''));
}

/**
 * Mongo filter for buyer/seller notification feeds.
 * Admins listing via the same service still get marketplace-only feed
 * (audit stays on ActivityLog / admin tools).
 */
export function marketplaceNotificationFilter(extra = {}) {
  return {
    ...extra,
    type: { $in: [...MARKETPLACE_NOTIFICATION_TYPES] },
  };
}

/**
 * Fallback deep-link when a notification was created without an explicit link.
 */
export function resolveNotificationLink(notification, { isSeller = false } = {}) {
  if (notification?.link) return notification.link;
  const type = String(notification?.type || '');
  const meta = notification?.meta || {};
  const orderNumber = meta.orderNumber || meta.orderId;
  const disputeId = meta.disputeId || meta.dispute;

  if (type.startsWith('order_') || type === 'purchase' || type === 'delivery' || type === 'payment_success' || type === 'payment_failed') {
    if (orderNumber) return isSeller ? `/seller/orders` : `/orders/${orderNumber}`;
    return isSeller ? '/seller/orders' : '/orders';
  }
  if (type.startsWith('dispute_') || type.startsWith('replacement_')) {
    if (disputeId) return isSeller ? `/seller/disputes/${disputeId}` : `/disputes/${disputeId}`;
    return isSeller ? '/seller/messages' : '/disputes';
  }
  if (type.startsWith('withdrawal_')) {
    return isSeller ? '/seller/earnings' : '/wallet';
  }
  if (type.startsWith('wallet_') || type === 'refund_approved' || type === 'refund_completed') {
    return isSeller ? '/seller/earnings' : '/wallet';
  }
  if (type.startsWith('escrow_')) {
    return isSeller ? '/seller/escrow' : (orderNumber ? `/orders/${orderNumber}` : '/orders');
  }
  if (type === 'store_promotion') {
    return '/seller/overview?promote=1';
  }
  if (type === 'product_moderated' || type === 'inventory_low') {
    return '/seller/products';
  }
  if (type === 'review') {
    return meta.productSlug ? `/product/${meta.productSlug}` : (isSeller ? '/seller/reviews' : '/dashboard');
  }
  if (type === 'message') {
    return isSeller ? '/seller/messages' : '/disputes';
  }
  if (type === 'announcement' || type === 'system') {
    return isSeller ? '/seller/notifications' : '/notifications';
  }
  return isSeller ? '/seller/notifications' : '/notifications';
}

export default {
  MARKETPLACE_NOTIFICATION_TYPES,
  HIDDEN_NOTIFICATION_TYPES,
  isHiddenActivityAction,
  isMarketplaceNotificationType,
  marketplaceNotificationFilter,
  resolveNotificationLink,
};
