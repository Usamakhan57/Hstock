import { logger } from '../config/logger.js';
import { DOMAIN_EVENTS, SOCKET_EVENTS } from '../constants/events.js';
import { User } from '../models/index.js';
import { createNotification, notifyUsers } from '../services/notification.service.js';
import { buildSellerNewOrderMessage } from '../services/sellerOrderNotify.js';
import {
  emitOrderUpdate,
  emitPaymentUpdate,
  emitEscrowUpdate,
  emitWithdrawalUpdate,
  emitDisputeUpdate,
  emitToRoom,
  emitToAdmins,
} from '../realtime/socket.server.js';

/**
 * Register domain event → notification / realtime fan-out.
 */
export function registerEventHandlers(eventBus) {
  eventBus.on(DOMAIN_EVENTS.ORDER_CREATED, async (payload) => {
    try {
      const { order } = payload;
      if (!order) return;
      emitOrderUpdate(order);
      if (order.buyer) {
        await createNotification({
          userId: order.buyer,
          type: 'order_created',
          title: 'Order created',
          body: `Order ${order.orderNumber} was created. Complete payment to continue.`,
          link: `/orders/${order.orderNumber}`,
          meta: { orderId: String(order._id), orderNumber: order.orderNumber },
          sendEmail: true,
          emailType: 'order_created',
          emailData: {
            orderNumber: order.orderNumber,
            amount: order.totalAmount,
            currency: order.currency,
          },
          notifyAdmins: true,
        });
      }
      if (order.sellerUser) {
        // In-app only until payment + escrow succeed (Telegram fires on ESCROW_LOCKED).
        await createNotification({
          userId: order.sellerUser,
          type: 'order_created',
          title: 'New order',
          body: `Buyer placed order ${order.orderNumber}.`,
          link: '/seller/orders',
          meta: { orderId: String(order._id), orderNumber: order.orderNumber },
          sendTelegram: false,
        });
      }
    } catch (error) {
      logger.error('ORDER_CREATED handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.ORDER_DELIVERED, async (payload) => {
    try {
      const { order } = payload;
      if (!order?.buyer) return;
      emitOrderUpdate(order);
      await createNotification({
        userId: order.buyer,
        type: 'delivery',
        title: 'Order delivered',
        body: `Order ${order.orderNumber || ''} has been delivered.`,
        link: order.orderNumber ? `/orders/${order.orderNumber}` : '/orders',
        meta: { orderId: String(order._id), orderNumber: order.orderNumber },
      });
    } catch (error) {
      logger.error('ORDER_DELIVERED handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.PAYMENT_SUCCESS, async (payload) => {
    try {
      const { payment, order } = payload;
      if (payment) emitPaymentUpdate(payment);
      if (order) emitOrderUpdate(order);

      const buyerId = order?.buyer || payment?.buyer;
      const sellerId = order?.sellerUser || payment?.sellerUser;

      if (buyerId) {
        await createNotification({
          userId: buyerId,
          type: 'payment_success',
          title: 'Payment successful',
          body: `Payment confirmed for order ${order?.orderNumber || ''}.`,
          link: order?.orderNumber ? `/orders/${order.orderNumber}` : null,
          meta: {
            paymentId: payment?._id ? String(payment._id) : null,
            orderNumber: order?.orderNumber,
          },
          sendEmail: true,
          emailType: 'payment_success',
          emailData: { orderNumber: order?.orderNumber },
          notifyAdmins: true,
        });
      }
      if (sellerId && String(sellerId) !== String(buyerId)) {
        // In-app only — rich Telegram "New Order Received" is sent on ESCROW_LOCKED.
        await createNotification({
          userId: sellerId,
          type: 'payment_success',
          title: 'Payment received',
          body: `Payment received for order ${order?.orderNumber || ''}. Funds are held in escrow.`,
          link: '/seller/orders',
          meta: {
            paymentId: payment?._id ? String(payment._id) : null,
            orderNumber: order?.orderNumber,
          },
          sendTelegram: false,
        });
      }
    } catch (error) {
      logger.error('PAYMENT_SUCCESS handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.PAYMENT_FAILED, async (payload) => {
    try {
      const { payment, order, reason } = payload;
      if (payment) emitPaymentUpdate(payment);
      if (order?.buyer || payment?.buyer) {
        await createNotification({
          userId: order?.buyer || payment?.buyer,
          type: 'payment_failed',
          title: 'Payment failed',
          body: `Payment failed for order ${order?.orderNumber || ''}${reason ? `: ${reason}` : '.'}`,
          link: order?.orderNumber ? `/orders/${order.orderNumber}` : null,
          sendEmail: true,
          emailType: 'payment_failed',
          emailData: { orderNumber: order?.orderNumber, reason },
          notifyAdmins: true,
        });
      }
    } catch (error) {
      logger.error('PAYMENT_FAILED handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.ESCROW_LOCKED, async (payload) => {
    try {
      const { escrow, order } = payload;
      if (escrow) emitEscrowUpdate(escrow);
      if (order) emitOrderUpdate(order);
      const sellerId = escrow?.sellerUser || order?.sellerUser;
      if (sellerId) {
        let buyer = null;
        if (order?.buyer) {
          try {
            buyer = await User.findById(order.buyer).select('name email').lean();
          } catch (lookupError) {
            logger.warn('Seller order notify buyer lookup failed', { message: lookupError.message });
          }
        }
        const message = buildSellerNewOrderMessage(order || {}, buyer);
        // After payment verified + escrow created + order exists — Telegram mirrors this.
        await createNotification({
          userId: sellerId,
          type: 'escrow_locked',
          title: message.title,
          body: message.body,
          link: message.link,
          meta: {
            ...message.meta,
            escrowId: escrow?._id ? String(escrow._id) : null,
          },
          sendTelegram: true,
        });
      }
    } catch (error) {
      logger.error('ESCROW_LOCKED handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.ESCROW_RELEASED, async (payload) => {
    try {
      const { escrow, order } = payload;
      if (escrow) emitEscrowUpdate(escrow);
      if (order) emitOrderUpdate(order);
      const buyerId = escrow?.buyer || order?.buyer;
      const sellerId = escrow?.sellerUser || order?.sellerUser;

      if (buyerId) {
        await createNotification({
          userId: buyerId,
          type: 'escrow_released',
          title: 'Escrow released',
          body: `Escrow released for order ${order?.orderNumber || ''}.`,
          link: order?.orderNumber ? `/orders/${order.orderNumber}` : '/wallet',
          sendEmail: true,
          emailType: 'escrow_released',
          emailData: { orderNumber: order?.orderNumber },
          notifyAdmins: true,
        });
      }
      if (sellerId && String(sellerId) !== String(buyerId)) {
        await createNotification({
          userId: sellerId,
          type: 'escrow_released',
          title: 'Escrow released',
          body: `Escrow funds were released for order ${order?.orderNumber || ''}.`,
          link: '/seller/earnings',
          meta: { orderNumber: order?.orderNumber },
        });
      }
    } catch (error) {
      logger.error('ESCROW_RELEASED handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.WITHDRAWAL_REQUESTED, async (payload) => {
    try {
      const { withdrawal } = payload;
      if (!withdrawal) return;
      emitWithdrawalUpdate(withdrawal);
      const userId = withdrawal.sellerUser || withdrawal.user;
      if (userId) {
        await createNotification({
          userId,
          type: 'withdrawal_requested',
          title: 'Withdrawal requested',
          body: `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency || 'USD'} is pending review.`,
          link: '/seller/earnings',
          sendEmail: true,
          emailType: 'withdrawal_requested',
          emailData: { amount: withdrawal.amount, currency: withdrawal.currency },
          notifyAdmins: true,
        });
      }
      emitToAdmins(SOCKET_EVENTS.ADMIN_DASHBOARD, { type: 'withdrawal', withdrawal });
    } catch (error) {
      logger.error('WITHDRAWAL_REQUESTED handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.WITHDRAWAL_APPROVED, async (payload) => {
    try {
      const { withdrawal } = payload;
      if (!withdrawal) return;
      emitWithdrawalUpdate(withdrawal);
      const userId = withdrawal.sellerUser || withdrawal.user;
      if (userId) {
        await createNotification({
          userId,
          type: 'withdrawal_approved',
          title: 'Withdrawal approved',
          body: `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency || 'USD'} was approved.`,
          link: '/seller/earnings',
          sendEmail: true,
          emailType: 'withdrawal_approved',
          emailData: { amount: withdrawal.amount, currency: withdrawal.currency },
        });
      }
    } catch (error) {
      logger.error('WITHDRAWAL_APPROVED handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.WITHDRAWAL_REJECTED, async (payload) => {
    try {
      const { withdrawal, reason } = payload;
      if (!withdrawal) return;
      emitWithdrawalUpdate(withdrawal);
      const userId = withdrawal.sellerUser || withdrawal.user;
      if (userId) {
        await createNotification({
          userId,
          type: 'withdrawal_rejected',
          title: 'Withdrawal rejected',
          body: `Your withdrawal was rejected${reason ? `: ${reason}` : '.'}`,
          link: '/seller/earnings',
          sendEmail: true,
          emailType: 'withdrawal_rejected',
          emailData: { reason },
        });
      }
    } catch (error) {
      logger.error('WITHDRAWAL_REJECTED handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.WITHDRAWAL_PAID, async (payload) => {
    try {
      const { withdrawal } = payload;
      if (!withdrawal) return;
      emitWithdrawalUpdate(withdrawal);
      const userId = withdrawal.sellerUser || withdrawal.user;
      if (userId) {
        await createNotification({
          userId,
          type: 'withdrawal_paid',
          title: 'Withdrawal paid',
          body: `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency || 'USD'} was paid.`,
          link: '/seller/earnings',
          sendEmail: true,
          emailType: 'withdrawal_paid',
          emailData: { amount: withdrawal.amount, currency: withdrawal.currency },
        });
      }
    } catch (error) {
      logger.error('WITHDRAWAL_PAID handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.DISPUTE_OPENED, async (payload) => {
    try {
      const { dispute, order } = payload;
      if (dispute) emitDisputeUpdate(dispute);
      const buyerId = dispute?.buyer;
      const sellerId = dispute?.sellerUser;

      if (buyerId) {
        await createNotification({
          userId: buyerId,
          type: 'dispute_opened',
          title: 'Dispute opened',
          body: `A dispute was opened for order ${order?.orderNumber || dispute?.orderNumber || ''}.`,
          link: dispute?._id ? `/disputes/${dispute._id}` : '/disputes',
          sendEmail: true,
          emailType: 'dispute_opened',
          emailData: {
            orderNumber: order?.orderNumber || dispute?.orderNumber,
            disputeId: dispute?._id ? String(dispute._id) : null,
          },
          notifyAdmins: true,
        });
      }
      if (sellerId && String(sellerId) !== String(buyerId)) {
        await createNotification({
          userId: sellerId,
          type: 'dispute_opened',
          title: 'New dispute',
          body: `A buyer opened a dispute for order ${order?.orderNumber || dispute?.orderNumber || ''}.`,
          link: dispute?._id ? `/seller/disputes/${dispute._id}` : '/seller/disputes',
          meta: {
            orderNumber: order?.orderNumber || dispute?.orderNumber,
            disputeId: dispute?._id ? String(dispute._id) : null,
          },
        });
      }
    } catch (error) {
      logger.error('DISPUTE_OPENED handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.DISPUTE_UPDATED, async (payload) => {
    try {
      const { dispute, order, note } = payload;
      if (dispute) emitDisputeUpdate(dispute);
      const targets = [dispute?.buyer, dispute?.sellerUser].filter(Boolean);
      await notifyUsers(targets, {
        type: 'dispute_updated',
        title: 'Dispute updated',
        body: note
          || `Dispute updated for order ${order?.orderNumber || dispute?.orderNumber || ''}.`,
        link: dispute?._id ? `/disputes/${dispute._id}` : '/disputes',
        meta: {
          disputeId: dispute?._id ? String(dispute._id) : null,
          orderNumber: order?.orderNumber || dispute?.orderNumber,
        },
      });
    } catch (error) {
      logger.error('DISPUTE_UPDATED handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.DISPUTE_RESOLVED, async (payload) => {
    try {
      const { dispute, order, resolution } = payload;
      if (dispute) emitDisputeUpdate(dispute, { resolution });
      const targets = [dispute?.buyer, dispute?.sellerUser].filter(Boolean);
      await notifyUsers(targets, {
        type: 'dispute_resolved',
        title: 'Dispute resolved',
        body: `Dispute resolved${resolution ? ` (${resolution})` : ''} for order ${order?.orderNumber || ''}.`,
        link: dispute?._id ? `/disputes/${dispute._id}` : '/disputes',
        sendEmail: true,
        emailType: 'dispute_resolved',
        emailData: {
          orderNumber: order?.orderNumber,
          resolution,
        },
        notifyAdmins: true,
      });
    } catch (error) {
      logger.error('DISPUTE_RESOLVED handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.DISPUTE_CHAT_MESSAGE, async (payload) => {
    try {
      const { disputeId, message, recipients = [], actorRole } = payload;
      if (disputeId) {
        emitToRoom(`dispute:${disputeId}`, SOCKET_EVENTS.DISPUTE_CHAT_MESSAGE, {
          disputeId,
          message,
          at: new Date().toISOString(),
        });
      }
      for (const userId of recipients) {
        const isBuyerMessage = actorRole === 'buyer';
        // eslint-disable-next-line no-await-in-loop
        await createNotification({
          userId,
          type: 'dispute_message',
          title: isBuyerMessage ? 'New buyer message' : 'New dispute message',
          body: isBuyerMessage
            ? 'A buyer sent a new message in a dispute chat.'
            : 'You have a new message in a dispute chat.',
          link: `/disputes/${disputeId}`,
          meta: { disputeId, messageId: message?._id },
        });
      }
    } catch (error) {
      logger.error('DISPUTE_CHAT_MESSAGE handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.REFUND_APPROVED, async (payload) => {
    try {
      const { refund, order } = payload;
      if (order?.buyer || refund?.buyer) {
        await createNotification({
          userId: order?.buyer || refund?.buyer,
          type: 'refund_approved',
          title: 'Refund approved',
          body: `Your refund for order ${order?.orderNumber || ''} was approved.`,
          link: order?.orderNumber ? `/orders/${order.orderNumber}` : '/orders',
          meta: {
            refundId: refund?._id ? String(refund._id) : null,
            orderNumber: order?.orderNumber,
          },
        });
      }
    } catch (error) {
      logger.error('REFUND_APPROVED handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.REFUND_COMPLETED, async (payload) => {
    try {
      const { refund, order } = payload;
      if (order?.buyer || refund?.buyer) {
        await createNotification({
          userId: order?.buyer || refund?.buyer,
          type: 'refund_completed',
          title: 'Refund completed',
          body: `Refund of ${refund?.amount ?? ''} ${refund?.currency || 'USD'} completed for order ${order?.orderNumber || ''}.`,
          link: order?.orderNumber ? `/orders/${order.orderNumber}` : '/orders',
          meta: {
            refundId: refund?._id ? String(refund._id) : null,
            orderNumber: order?.orderNumber,
          },
          notifyAdmins: true,
        });
      }
    } catch (error) {
      logger.error('REFUND_COMPLETED handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.REPLACEMENT_REQUESTED, async (payload) => {
    try {
      const { dispute, replacement, order } = payload;
      const buyerId = dispute?.buyer;
      const sellerId = dispute?.sellerUser;

      if (buyerId) {
        await createNotification({
          userId: buyerId,
          type: 'replacement_requested',
          title: 'Replacement ready to review',
          body: `A replacement was sent for dispute on order ${order?.orderNumber || dispute?.orderNumber || ''}. Please confirm whether the account works.`,
          link: dispute?._id ? `/disputes/${dispute._id}` : '/disputes',
          sendEmail: true,
          emailType: 'replacement_requested',
          emailData: {
            orderNumber: order?.orderNumber || dispute?.orderNumber,
            version: replacement?.version,
            disputeId: dispute?._id ? String(dispute._id) : null,
          },
          meta: {
            disputeId: dispute?._id ? String(dispute._id) : null,
            replacementId: replacement?._id || replacement?.id || null,
          },
        });
      }
      if (sellerId) {
        await createNotification({
          userId: sellerId,
          type: 'replacement_requested',
          title: 'Replacement submitted',
          body: `Replacement v${replacement?.version || ''} was sent for order ${order?.orderNumber || ''}. Waiting for buyer confirmation.`,
          link: dispute?._id ? `/seller/disputes/${dispute._id}` : '/seller/disputes',
          meta: {
            disputeId: dispute?._id ? String(dispute._id) : null,
            replacementId: replacement?._id || replacement?.id || null,
          },
        });
      }
    } catch (error) {
      logger.error('REPLACEMENT_REQUESTED handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.REPLACEMENT_ACCEPTED, async (payload) => {
    try {
      const { dispute, replacement, order } = payload;
      const targets = [dispute?.buyer, dispute?.sellerUser].filter(Boolean);
      await notifyUsers(targets, {
        type: 'replacement_accepted',
        title: 'Replacement accepted',
        body: `Replacement v${replacement?.version || ''} was accepted for order ${order?.orderNumber || ''}.`,
        link: dispute?._id ? `/disputes/${dispute._id}` : '/disputes',
        meta: {
          disputeId: dispute?._id ? String(dispute._id) : null,
          replacementId: replacement?._id || replacement?.id || null,
        },
      });
    } catch (error) {
      logger.error('REPLACEMENT_ACCEPTED handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.REPLACEMENT_REJECTED, async (payload) => {
    try {
      const { dispute, replacement, order } = payload;
      const targets = [dispute?.buyer, dispute?.sellerUser].filter(Boolean);
      await notifyUsers(targets, {
        type: 'replacement_rejected',
        title: 'Replacement rejected',
        body: `Replacement v${replacement?.version || ''} was rejected for order ${order?.orderNumber || ''}.`,
        link: dispute?._id ? `/disputes/${dispute._id}` : '/disputes',
        meta: {
          disputeId: dispute?._id ? String(dispute._id) : null,
          replacementId: replacement?._id || replacement?.id || null,
        },
      });
    } catch (error) {
      logger.error('REPLACEMENT_REJECTED handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.BUYER_WALLET_CREDITED, async (payload) => {
    try {
      const buyerId = payload.buyerId;
      if (!buyerId) return;
      const amount = payload.amount;
      const purpose = payload.purpose || 'credit';
      const typeMap = {
        deposit: 'wallet_deposit',
        topup: 'wallet_topup',
        refund: 'wallet_refund',
        adjustment: 'wallet_adjustment',
      };
      await createNotification({
        userId: buyerId,
        type: typeMap[purpose] || 'wallet_deposit',
        title: purpose === 'refund' ? 'Refund credited to wallet' : 'Wallet balance updated',
        body: `$${Number(amount || 0).toFixed(2)} was credited to your wallet (${purpose}).`,
        link: '/wallet',
        meta: { amount, purpose },
        sendEmail: true,
        emailType: 'system',
        emailData: { amount, purpose },
      });
      emitToRoom(`user:${buyerId}`, SOCKET_EVENTS.BUYER_DASHBOARD, {
        type: 'wallet_credited',
        amount,
        purpose,
        wallet: payload.wallet || null,
      });
    } catch (error) {
      logger.error('BUYER_WALLET_CREDITED handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.BUYER_WALLET_DEBITED, async (payload) => {
    try {
      const buyerId = payload.buyerId;
      if (!buyerId) return;
      await createNotification({
        userId: buyerId,
        type: 'wallet_purchase',
        title: 'Wallet purchase',
        body: `$${Number(payload.amount || 0).toFixed(2)} was spent from your wallet.`,
        link: '/wallet',
        meta: { amount: payload.amount, orderId: payload.orderId || null },
        sendEmail: false,
      });
      emitToRoom(`user:${buyerId}`, SOCKET_EVENTS.BUYER_DASHBOARD, {
        type: 'wallet_debited',
        amount: payload.amount,
        wallet: payload.wallet || null,
      });
    } catch (error) {
      logger.error('BUYER_WALLET_DEBITED handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.BUYER_WALLET_DEPOSIT_PENDING, async (payload) => {
    try {
      const buyerId = payload.buyerId;
      if (!buyerId) return;
      await createNotification({
        userId: buyerId,
        type: payload.purpose === 'topup' ? 'wallet_topup' : 'wallet_deposit',
        title: payload.purpose === 'topup' ? 'Top-up invoice created' : 'Deposit invoice created',
        body: 'Complete Cryptomus payment to credit your wallet.',
        link: '/wallet',
        meta: { depositId: payload.deposit?._id || null },
      });
    } catch (error) {
      logger.error('BUYER_WALLET_DEPOSIT_PENDING handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.BUYER_WALLET_FROZEN, async (payload) => {
    try {
      if (!payload.buyerId) return;
      await createNotification({
        userId: payload.buyerId,
        type: 'wallet_frozen',
        title: 'Wallet frozen',
        body: payload.reason || 'Your wallet has been frozen by an administrator.',
        link: '/wallet',
        sendEmail: true,
        emailType: 'system',
        emailData: { reason: payload.reason },
      });
    } catch (error) {
      logger.error('BUYER_WALLET_FROZEN handler failed', { message: error.message });
    }
  });

  eventBus.on(DOMAIN_EVENTS.BUYER_WALLET_UNFROZEN, async (payload) => {
    try {
      if (!payload.buyerId) return;
      await createNotification({
        userId: payload.buyerId,
        type: 'wallet_unfrozen',
        title: 'Wallet unfrozen',
        body: 'Your wallet is active again.',
        link: '/wallet',
      });
    } catch (error) {
      logger.error('BUYER_WALLET_UNFROZEN handler failed', { message: error.message });
    }
  });

  logger.info('Domain event handlers registered');
}

export default { registerEventHandlers };
