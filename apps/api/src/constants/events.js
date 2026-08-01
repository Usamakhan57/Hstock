/**
 * Domain event names for notifications, email, and Socket.io fan-out.
 */
export const DOMAIN_EVENTS = Object.freeze({
  USER_REGISTERED: 'user.registered',
  EMAIL_VERIFICATION_SENT: 'auth.verification_sent',
  PASSWORD_RESET_REQUESTED: 'auth.password_reset_requested',
  ORDER_CREATED: 'order.created',
  ORDER_DELIVERED: 'order.delivered',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
  ESCROW_LOCKED: 'escrow.locked',
  ESCROW_RELEASED: 'escrow.released',
  WITHDRAWAL_REQUESTED: 'withdrawal.requested',
  WITHDRAWAL_APPROVED: 'withdrawal.approved',
  WITHDRAWAL_REJECTED: 'withdrawal.rejected',
  WITHDRAWAL_PAID: 'withdrawal.paid',
  DISPUTE_OPENED: 'dispute.opened',
  DISPUTE_UPDATED: 'dispute.updated',
  DISPUTE_RESOLVED: 'dispute.resolved',
  DISPUTE_CHAT_MESSAGE: 'dispute.chat.message',
  REFUND_APPROVED: 'refund.approved',
  REFUND_COMPLETED: 'refund.completed',
  REPLACEMENT_REQUESTED: 'replacement.requested',
  REPLACEMENT_ACCEPTED: 'replacement.accepted',
  REPLACEMENT_REJECTED: 'replacement.rejected',
  PRODUCT_MODERATED: 'product.moderated',
  NOTIFICATION_CREATED: 'notification.created',
  BUYER_WALLET_CREDITED: 'buyer_wallet.credited',
  BUYER_WALLET_DEBITED: 'buyer_wallet.debited',
  BUYER_WALLET_DEPOSIT_PENDING: 'buyer_wallet.deposit_pending',
  BUYER_WALLET_FROZEN: 'buyer_wallet.frozen',
  BUYER_WALLET_UNFROZEN: 'buyer_wallet.unfrozen',
});

export const SOCKET_EVENTS = Object.freeze({
  NOTIFICATION: 'notification',
  NOTIFICATION_UNREAD_COUNT: 'notification:unread_count',
  ORDER_UPDATED: 'order:updated',
  PAYMENT_UPDATED: 'payment:updated',
  ESCROW_UPDATED: 'escrow:updated',
  WITHDRAWAL_UPDATED: 'withdrawal:updated',
  DISPUTE_UPDATED: 'dispute:updated',
  DISPUTE_CHAT_MESSAGE: 'dispute:chat:message',
  SELLER_DASHBOARD: 'seller:dashboard',
  BUYER_DASHBOARD: 'buyer:dashboard',
  ADMIN_DASHBOARD: 'admin:dashboard',
});

export default {
  DOMAIN_EVENTS,
  SOCKET_EVENTS,
};
