import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../utils/transaction.js';
import { sha256Hex } from '../utils/crypto.js';
import { logger } from '../config/logger.js';
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  WEBHOOK_EVENT_STATUS,
} from '../constants/statuses.js';
import * as paymentRepository from '../repositories/payment.repository.js';
import * as orderRepository from '../repositories/order.repository.js';
import * as webhookRepository from '../repositories/webhook.repository.js';
import * as cryptomusService from './cryptomus.service.js';
import * as escrowService from './escrow.service.js';
import { logActivity } from './activity.service.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { Payment, SellerProfile } from '../models/index.js';
import { emitDomainEvent } from '../events/bus.js';
import { DOMAIN_EVENTS } from '../constants/events.js';

export async function getPayment(id, actor) {
  const payment = await Payment.findById(id).lean();
  if (!payment) {
    throw new AppError('Payment not found', 404, { code: 'PAYMENT_NOT_FOUND' });
  }
  assertPaymentAccess(payment, actor);
  return payment;
}

export async function listPayments(query = {}, actor) {
  const pagination = parsePagination(query);
  const filter = {};
  const isAdmin = actor?.roles?.some((r) => ['admin', 'super_admin', 'support'].includes(r));

  if (!isAdmin) {
    if (actor?.roles?.includes('seller') && query.scope === 'seller') {
      const seller = await SellerProfile.findOne({ user: actor.id }).select('_id').lean();
      if (!seller) {
        throw new AppError('Seller profile not found', 404, { code: 'SELLER_NOT_FOUND' });
      }
      // Bind to authenticated seller — never trust client-supplied sellerId
      filter.seller = seller._id;
    } else {
      filter.buyer = actor.id;
    }
  } else {
    if (query.buyerId) filter.buyer = query.buyerId;
    if (query.sellerId) filter.seller = query.sellerId;
  }
  if (query.status) filter.status = query.status;
  if (query.orderId) filter.order = query.orderId;

  const { items, total } = await paymentRepository.listPayments(filter, pagination);
  return { items, meta: buildPaginationMeta({ ...pagination, total }) };
}

function assertPaymentAccess(payment, actor) {
  if (!actor) {
    throw new AppError('Unauthorized', 401, { code: 'UNAUTHORIZED' });
  }
  const isAdmin = actor.roles?.some((r) => ['admin', 'super_admin', 'support'].includes(r));
  if (isAdmin) return;
  if (String(payment.buyer) === String(actor.id)) return;
  if (payment.sellerUser && String(payment.sellerUser) === String(actor.id)) return;
  throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
}

/**
 * Apply provider status to payment + order. Idempotent for paid transitions.
 */
export async function applyProviderPaymentUpdate({
  payment,
  providerStatus,
  raw = null,
  txid = null,
  source = 'sync',
  session = null,
}) {
  // Always re-load inside the active session to avoid dirty in-memory state
  // after a transaction fallback retry on standalone MongoDB.
  const paymentId = payment._id || payment;
  const fresh = await paymentRepository.findPaymentById(paymentId, { session });
  if (!fresh) {
    throw new AppError('Payment not found', 404, { code: 'PAYMENT_NOT_FOUND' });
  }

  const mapped = cryptomusService.mapCryptomusStatusToPaymentStatus(providerStatus);
  const previous = fresh.status;

  fresh.providerStatus = providerStatus;
  fresh.lastSyncedAt = new Date();
  if (raw) fresh.rawLastWebhook = raw;
  if (txid) fresh.txid = txid;
  if (raw?.address) fresh.address = raw.address;
  if (raw?.payer_amount) fresh.payerAmount = String(raw.payer_amount);
  if (raw?.payer_currency) fresh.payerCurrency = raw.payer_currency;
  if (raw?.merchant_amount) fresh.merchantAmount = String(raw.merchant_amount);
  if (raw?.payment_amount) fresh.paymentAmount = String(raw.payment_amount);
  if (raw?.is_final !== undefined) fresh.isFinal = Boolean(raw.is_final);

  if (mapped === PAYMENT_STATUS.PAID) {
    if (previous === PAYMENT_STATUS.PAID) {
      // Ensure escrow lock happened even if a prior attempt was interrupted
      const order = await orderRepository.findOrderById(fresh.order, { session });
      if (order && order.status !== ORDER_STATUS.ESCROW && order.status !== ORDER_STATUS.COMPLETED) {
        await escrowService.lockEscrowAfterPayment({
          orderId: fresh.order,
          paymentId: fresh._id,
          session,
        });
      }
      if (session) await fresh.save({ session });
      else await fresh.save();
      return { payment: fresh, alreadyPaid: true };
    }

    fresh.status = PAYMENT_STATUS.PAID;
    fresh.paidAt = new Date();
    fresh.isFinal = true;
    if (session) await fresh.save({ session });
    else await fresh.save();

    const order = await orderRepository.findOrderById(fresh.order, { session });
    if (order) {
      order.status = ORDER_STATUS.PAID;
      order.paidAt = fresh.paidAt;
      if (session) await order.save({ session });
      else await order.save();
    }

    await escrowService.lockEscrowAfterPayment({
      orderId: fresh.order,
      paymentId: fresh._id,
      session,
    });

    await logActivity({
      userId: fresh.buyer,
      action: 'payments.paid',
      resource: 'Payment',
      resourceId: fresh._id,
      meta: { providerStatus, source, orderId: fresh.order },
      session,
    });

    const paidOrder = await orderRepository.findOrderById(fresh.order, { session });
    emitDomainEvent(DOMAIN_EVENTS.PAYMENT_SUCCESS, {
      payment: fresh.toObject ? fresh.toObject() : fresh,
      order: paidOrder?.toObject ? paidOrder.toObject() : paidOrder,
    });

    return { payment: fresh, alreadyPaid: false };
  }

  if (mapped === PAYMENT_STATUS.PROCESSING || mapped === PAYMENT_STATUS.PARTIAL) {
    if (previous !== PAYMENT_STATUS.PAID) {
      fresh.status = mapped;
      const order = await orderRepository.findOrderById(fresh.order, { session });
      if (order && [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAYMENT_PROCESSING].includes(order.status)) {
        order.status = ORDER_STATUS.PAYMENT_PROCESSING;
        if (session) await order.save({ session });
        else await order.save();
      }
    }
  } else if (mapped === PAYMENT_STATUS.EXPIRED && previous !== PAYMENT_STATUS.PAID) {
    fresh.status = PAYMENT_STATUS.EXPIRED;
    fresh.isFinal = true;
  } else if (mapped === PAYMENT_STATUS.CANCELLED && previous !== PAYMENT_STATUS.PAID) {
    fresh.status = PAYMENT_STATUS.CANCELLED;
    fresh.isFinal = true;
  } else if (mapped === PAYMENT_STATUS.FAILED && previous !== PAYMENT_STATUS.PAID) {
    fresh.status = PAYMENT_STATUS.FAILED;
    fresh.failureReason = raw?.status || providerStatus;
  } else if (mapped === PAYMENT_STATUS.REFUNDED) {
    fresh.status = PAYMENT_STATUS.REFUNDED;
  }

  if (session) await fresh.save({ session });
  else await fresh.save();

  if (
    previous !== PAYMENT_STATUS.FAILED
    && fresh.status === PAYMENT_STATUS.FAILED
  ) {
    const failedOrder = await orderRepository.findOrderById(fresh.order, { session });
    emitDomainEvent(DOMAIN_EVENTS.PAYMENT_FAILED, {
      payment: fresh.toObject ? fresh.toObject() : fresh,
      order: failedOrder?.toObject ? failedOrder.toObject() : failedOrder,
      reason: fresh.failureReason,
    });
  }

  return { payment: fresh, alreadyPaid: previous === PAYMENT_STATUS.PAID };
}

/**
 * Cryptomus webhook handler with signature, replay, and duplicate protection.
 */
export async function handleCryptomusWebhook(payload, { ip = null } = {}) {
  cryptomusService.assertWebhookIpAllowed(ip);
  cryptomusService.verifyWebhookSignature(payload);
  cryptomusService.assertWebhookNotExpired(payload);

  const eventKey = cryptomusService.buildWebhookEventKey(payload);
  const existing = await webhookRepository.findWebhookByEventKey(eventKey);
  if (existing) {
    if (existing.status === WEBHOOK_EVENT_STATUS.PROCESSED) {
      return {
        duplicate: true,
        eventId: existing._id,
        message: 'Webhook already processed',
      };
    }
    if (existing.status === WEBHOOK_EVENT_STATUS.PROCESSING) {
      return {
        duplicate: true,
        eventId: existing._id,
        message: 'Webhook currently processing',
      };
    }
  }

  let event;
  try {
    event = existing || await webhookRepository.createWebhookEvent({
      provider: 'cryptomus',
      eventKey,
      externalId: payload.uuid || null,
      orderId: payload.order_id || null,
      signature: payload.sign || null,
      payloadHash: sha256Hex(JSON.stringify(payload)),
      status: WEBHOOK_EVENT_STATUS.PROCESSING,
      providerStatus: payload.status || payload.payment_status || null,
      ip,
      payload,
    });
    if (existing) {
      event.status = WEBHOOK_EVENT_STATUS.PROCESSING;
      event.attempts = (event.attempts || 0) + 1;
      await event.save();
    }
  } catch (error) {
    if (error?.code === 11000) {
      return { duplicate: true, message: 'Webhook duplicate event key' };
    }
    throw error;
  }

  try {
    const result = await withTransaction(async (session) => {
      let payment = null;
      if (payload.uuid) {
        payment = await paymentRepository.findPaymentByCryptomusUuid(payload.uuid, { session });
      }
      if (!payment && payload.order_id) {
        payment = await paymentRepository.findPaymentByCryptomusOrderId(payload.order_id, {
          session,
        });
      }

      // Wallet deposit / top-up invoices (Cryptomus order_id prefix wal_)
      if (!payment) {
        const buyerWalletService = await import('./buyerWallet.service.js');
        const deposit = await buyerWalletService.findDepositByCryptomus(
          payload.uuid,
          payload.order_id,
          session,
        );
        if (!deposit) {
          throw new AppError('Payment not found for webhook', 404, {
            code: 'PAYMENT_NOT_FOUND',
          });
        }

        deposit.webhookCount = (deposit.webhookCount || 0) + 1;
        deposit.lastWebhookAt = new Date();
        if (!deposit.cryptomusUuid && payload.uuid) deposit.cryptomusUuid = payload.uuid;

        const providerStatus = payload.status || payload.payment_status;
        const applied = await buyerWalletService.applyDepositPaid(deposit, {
          providerStatus,
          raw: payload,
          txid: payload.txid || null,
          session,
        });

        event.status = WEBHOOK_EVENT_STATUS.PROCESSED;
        event.processedAt = new Date();
        event.payload = { ...(event.payload || {}), kind: 'wallet_deposit', depositId: String(deposit._id) };
        if (session) await event.save({ session });
        else await event.save();

        return {
          kind: 'wallet_deposit',
          deposit: applied.deposit,
          alreadyPaid: applied.alreadyCredited,
        };
      }

      payment.webhookCount = (payment.webhookCount || 0) + 1;
      payment.lastWebhookAt = new Date();
      if (!payment.cryptomusUuid && payload.uuid) payment.cryptomusUuid = payload.uuid;

      const providerStatus = payload.status || payload.payment_status;
      const applied = await applyProviderPaymentUpdate({
        payment,
        providerStatus,
        raw: payload,
        txid: payload.txid || null,
        source: 'webhook',
        session,
      });

      event.payment = payment._id;
      event.order = payment.order;
      event.status = WEBHOOK_EVENT_STATUS.PROCESSED;
      event.processedAt = new Date();
      if (session) await event.save({ session });
      else await event.save();

      return { kind: 'order_payment', ...applied };
    });

    if (result.kind === 'wallet_deposit') {
      return {
        duplicate: false,
        eventId: event._id,
        depositId: result.deposit._id,
        status: result.deposit.status,
        alreadyPaid: result.alreadyPaid,
        kind: 'wallet_deposit',
      };
    }

    return {
      duplicate: false,
      eventId: event._id,
      paymentId: result.payment._id,
      status: result.payment.status,
      alreadyPaid: result.alreadyPaid,
      kind: 'order_payment',
    };
  } catch (error) {
    logger.error('Cryptomus webhook processing failed', {
      error: error.message,
      eventKey,
    });
    event.status = WEBHOOK_EVENT_STATUS.FAILED;
    event.lastError = error.message;
    await event.save();
    throw error;
  }
}

export async function syncPaymentFromCryptomus(paymentId, actor = null) {
  const payment = await paymentRepository.findPaymentById(paymentId);
  if (!payment) {
    throw new AppError('Payment not found', 404, { code: 'PAYMENT_NOT_FOUND' });
  }
  if (actor) assertPaymentAccess(payment, actor);

  if (!cryptomusService.isCryptomusConfigured()) {
    throw new AppError('Cryptomus is not configured', 503, {
      code: 'CRYPTOMUS_NOT_CONFIGURED',
    });
  }

  const info = await cryptomusService.getPaymentInfo({
    uuid: payment.cryptomusUuid,
    orderId: payment.cryptomusOrderId,
  });

  return applyProviderPaymentUpdate({
    payment,
    providerStatus: info.payment_status || info.status,
    raw: info,
    txid: info.txid || null,
    source: 'sync',
  });
}

export async function retryFailedPayments({ limit = 50 } = {}) {
  const payments = await paymentRepository.findPaymentsNeedingSync(limit);
  const results = { processed: 0, succeeded: 0, failed: 0 };

  for (const payment of payments) {
    results.processed += 1;
    try {
      if (!cryptomusService.isCryptomusConfigured()) break;
      await syncPaymentFromCryptomus(payment._id);
      results.succeeded += 1;
    } catch (error) {
      results.failed += 1;
      logger.warn('Payment sync retry failed', {
        paymentId: String(payment._id),
        error: error.message,
      });
    }
  }
  return results;
}

export async function retryFailedWebhooks({ limit = 50 } = {}) {
  const events = await webhookRepository.findFailedWebhooks(limit);
  const results = { processed: 0, succeeded: 0, failed: 0 };

  for (const event of events) {
    results.processed += 1;
    try {
      await handleCryptomusWebhook(event.payload, { ip: event.ip });
      results.succeeded += 1;
    } catch {
      results.failed += 1;
    }
  }
  return results;
}

/**
 * Test/sandbox helper: mark a simulated payment as paid (non-production).
 */
export async function sandboxConfirmPayment(cryptomusUuid) {
  const { env } = await import('../config/env.js');
  if (env.isProduction) {
    throw new AppError('Sandbox confirm disabled in production', 403, {
      code: 'FORBIDDEN',
    });
  }

  const payment = await paymentRepository.findPaymentByCryptomusUuid(cryptomusUuid);
  if (!payment) {
    throw new AppError('Payment not found', 404, { code: 'PAYMENT_NOT_FOUND' });
  }

  const payload = {
    uuid: payment.cryptomusUuid,
    order_id: payment.cryptomusOrderId,
    status: 'paid',
    payment_status: 'paid',
    is_final: true,
    txid: `sandbox_${Date.now()}`,
    sign: 'sandbox',
  };

  // Bypass signature in sandbox confirm by applying directly
  return withTransaction(async (session) => applyProviderPaymentUpdate({
    payment,
    providerStatus: 'paid',
    raw: payload,
    txid: payload.txid,
    source: 'sandbox',
    session,
  }));
}

export default {
  getPayment,
  listPayments,
  applyProviderPaymentUpdate,
  handleCryptomusWebhook,
  syncPaymentFromCryptomus,
  retryFailedPayments,
  retryFailedWebhooks,
  sandboxConfirmPayment,
};
