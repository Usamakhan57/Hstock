import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../utils/transaction.js';
import { addHours } from '../helpers/date.helper.js';
import { roundMoney } from '../helpers/money.helper.js';
import {
  ESCROW_STATUS,
  ORDER_STATUS,
  DELIVERY_STATUS,
} from '../constants/statuses.js';
import * as escrowRepository from '../repositories/escrow.repository.js';
import * as orderRepository from '../repositories/order.repository.js';
import * as walletService from './wallet.service.js';
import { getPlatformConfig } from './config.service.js';
import { logActivity } from './activity.service.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { Order, Escrow } from '../models/index.js';
import { DISPUTE_TIMELINE_EVENTS } from '../constants/disputeFinal.js';
import * as disputeTimelineService from './disputeTimeline.service.js';

/**
 * Create escrow in pending state (linked to order/payment before lock).
 */
export async function createPendingEscrow({
  order,
  payment,
  session = null,
}) {
  return escrowRepository.createEscrow(
    {
      order: order._id,
      payment: payment._id,
      buyer: order.buyer,
      seller: order.seller,
      sellerUser: order.sellerUser,
      amount: order.totalAmount,
      commissionPercent: order.commissionPercent,
      commissionAmount: order.commissionAmount,
      sellerAmount: order.sellerAmount,
      currency: order.currency,
      status: ESCROW_STATUS.PENDING,
    },
    session,
  );
}

/**
 * Lock funds into escrow after successful payment.
 * Starts the 24h auto-release timer.
 */
export async function lockEscrowAfterPayment({
  orderId,
  paymentId,
  actorId = null,
  session = null,
}) {
  const run = async (activeSession) => {
    const order = await orderRepository.findOrderById(orderId, { session: activeSession });
    if (!order) {
      throw new AppError('Order not found', 404, { code: 'ORDER_NOT_FOUND' });
    }

    let escrow = await escrowRepository.findEscrowByOrder(orderId, { session: activeSession });
    if (!escrow) {
      escrow = await createPendingEscrow({
        order,
        payment: { _id: paymentId },
        session: activeSession,
      });
    }

    if (escrow.status === ESCROW_STATUS.RELEASED || escrow.status === ESCROW_STATUS.REFUNDED) {
      return escrow;
    }

    if (escrow.status === ESCROW_STATUS.LOCKED) {
      // Idempotent repair: ensure order reflects escrow state
      if (order.status !== ORDER_STATUS.ESCROW && order.status !== ORDER_STATUS.COMPLETED
        && order.status !== ORDER_STATUS.DISPUTED) {
        order.status = ORDER_STATUS.ESCROW;
        order.escrow = escrow._id;
        order.escrowedAt = order.escrowedAt || escrow.lockedAt || new Date();
        order.paidAt = order.paidAt || order.escrowedAt;
        order.deliveryStatus = DELIVERY_STATUS.AWAITING_DELIVERY;
        if (activeSession) await order.save({ session: activeSession });
        else await order.save();
      }
      return escrow;
    }

    const platform = await getPlatformConfig();
    const hours = platform?.escrowAutoReleaseHours || 24;
    const now = new Date();

    escrow.status = ESCROW_STATUS.LOCKED;
    escrow.lockedAt = now;
    escrow.releaseAt = addHours(now, hours);
    escrow.payment = paymentId;
    if (activeSession) await escrow.save({ session: activeSession });
    else await escrow.save();

    const wallet = await walletService.getOrCreateSellerWallet(
      order.seller,
      order.sellerUser,
      activeSession,
    );

    await walletService.recordBuyerPaymentIntoEscrow({
      wallet,
      amount: order.totalAmount,
      context: {
        order: order._id,
        payment: paymentId,
        escrow: escrow._id,
        buyer: order.buyer,
        currency: order.currency,
      },
      session: activeSession,
      createdBy: actorId,
    });

    order.status = ORDER_STATUS.ESCROW;
    order.escrow = escrow._id;
    order.escrowedAt = now;
    order.paidAt = order.paidAt || now;
    order.deliveryStatus = DELIVERY_STATUS.AWAITING_DELIVERY;
    if (activeSession) await order.save({ session: activeSession });
    else await order.save();

    await logActivity({
      userId: actorId,
      action: 'escrow.locked',
      resource: 'Escrow',
      resourceId: escrow._id,
      meta: {
        orderId: order._id,
        releaseAt: escrow.releaseAt,
        amount: order.totalAmount,
      },
      session: activeSession,
    });

    return escrow;
  };

  if (session) return run(session);
  return withTransaction(run);
}

/**
 * Release escrow to seller (auto or admin). Only when not disputed.
 */
export async function releaseEscrow(escrowId, {
  reason = 'auto_release',
  actor = null,
  session = null,
  force = false,
} = {}) {
  const run = async (activeSession) => {
    const escrow = await escrowRepository.findEscrowById(escrowId, { session: activeSession });
    if (!escrow) {
      throw new AppError('Escrow not found', 404, { code: 'ESCROW_NOT_FOUND' });
    }

    if (escrow.status === ESCROW_STATUS.RELEASED) {
      return escrow;
    }

    if (escrow.status === ESCROW_STATUS.REFUNDED) {
      throw new AppError('Escrow already refunded', 400, { code: 'ESCROW_REFUNDED' });
    }

    if (escrow.status === ESCROW_STATUS.DISPUTED && !force) {
      throw new AppError('Escrow is disputed and cannot be released', 400, {
        code: 'ESCROW_DISPUTED',
      });
    }

    if (escrow.dispute && !force) {
      throw new AppError('Active dispute blocks escrow release', 400, {
        code: 'ESCROW_DISPUTE_BLOCK',
      });
    }

    if (![ESCROW_STATUS.LOCKED, ESCROW_STATUS.DISPUTED].includes(escrow.status) && !force) {
      throw new AppError(`Escrow cannot be released from status ${escrow.status}`, 400, {
        code: 'ESCROW_INVALID_STATUS',
      });
    }

    const order = await orderRepository.findOrderById(escrow.order, { session: activeSession });
    if (!order) {
      throw new AppError('Order not found', 404, { code: 'ORDER_NOT_FOUND' });
    }

    const wallet = await walletService.getOrCreateSellerWallet(
      escrow.seller,
      escrow.sellerUser,
      activeSession,
    );

    await walletService.releaseEscrowToSeller({
      wallet,
      grossAmount: escrow.amount,
      commissionAmount: escrow.commissionAmount,
      sellerAmount: escrow.sellerAmount,
      context: {
        order: order._id,
        payment: escrow.payment,
        escrow: escrow._id,
        buyer: escrow.buyer,
        currency: escrow.currency,
      },
      session: activeSession,
      createdBy: actor?.id || null,
    });

    const now = new Date();
    escrow.status = ESCROW_STATUS.RELEASED;
    escrow.releasedAt = now;
    escrow.releaseReason = reason;
    escrow.releaseJobProcessedAt = now;
    if (activeSession) await escrow.save({ session: activeSession });
    else await escrow.save();

    order.status = ORDER_STATUS.COMPLETED;
    order.completedAt = now;
    if (order.deliveryStatus !== DELIVERY_STATUS.DELIVERED) {
      order.deliveryStatus = DELIVERY_STATUS.DELIVERED;
      order.deliveredAt = order.deliveredAt || now;
    }
    if (activeSession) await order.save({ session: activeSession });
    else await order.save();

    await logActivity({
      userId: actor?.id || null,
      action: 'escrow.released',
      resource: 'Escrow',
      resourceId: escrow._id,
      meta: { orderId: order._id, reason, sellerAmount: escrow.sellerAmount },
      session: activeSession,
    });

    return escrow;
  };

  if (session) return run(session);
  return withTransaction(run);
}

/**
 * Apply full or partial dispute hold.
 * Partial: only disputedAmount is frozen; undisputed continues normal release timer.
 * Full: entire escrow frozen (status=disputed).
 */
export async function markEscrowDisputed(
  escrowId,
  disputeId,
  session = null,
  {
    disputedAmount = null,
    isPartial = false,
  } = {},
) {
  const escrow = await escrowRepository.findEscrowById(escrowId, { session });
  if (!escrow) {
    throw new AppError('Escrow not found', 404, { code: 'ESCROW_NOT_FOUND' });
  }
  if (escrow.status === ESCROW_STATUS.RELEASED || escrow.status === ESCROW_STATUS.REFUNDED) {
    throw new AppError('Cannot dispute a closed escrow', 400, { code: 'ESCROW_CLOSED' });
  }

  const total = roundMoney(escrow.amount);
  const held = disputedAmount == null ? total : roundMoney(disputedAmount);
  if (!(held > 0) || held > total) {
    throw new AppError('Invalid disputed escrow amount', 400, { code: 'INVALID_DISPUTED_AMOUNT' });
  }

  escrow.dispute = disputeId;
  escrow.disputedAt = new Date();
  escrow.disputedAmount = held;
  escrow.heldAmount = held;
  escrow.undisputedAmount = roundMoney(total - held);
  escrow.partialDispute = Boolean(isPartial && held < total);

  if (escrow.partialDispute) {
    // Keep LOCKED so undisputed portion can still auto-release
    escrow.status = ESCROW_STATUS.LOCKED;
  } else {
    escrow.status = ESCROW_STATUS.DISPUTED;
  }

  if (session) await escrow.save({ session });
  else await escrow.save();
  return escrow;
}

/**
 * Release only the undisputed escrow portion to the seller (partial dispute path).
 */
export async function releaseUndisputedEscrowPortion(escrowId, {
  reason = 'undisputed_auto_release',
  actor = null,
  session = null,
} = {}) {
  const run = async (activeSession) => {
    const escrow = await escrowRepository.findEscrowById(escrowId, { session: activeSession });
    if (!escrow) throw new AppError('Escrow not found', 404, { code: 'ESCROW_NOT_FOUND' });
    if (!escrow.partialDispute || escrow.undisputedReleasedAt) {
      return escrow;
    }

    const gross = roundMoney(escrow.undisputedAmount);
    if (!(gross > 0)) {
      escrow.undisputedReleasedAt = new Date();
      if (activeSession) await escrow.save({ session: activeSession });
      else await escrow.save();
      return escrow;
    }

    const commission = roundMoney((gross * escrow.commissionPercent) / 100);
    const sellerNet = roundMoney(gross - commission);

    const wallet = await walletService.getOrCreateSellerWallet(
      escrow.seller,
      escrow.sellerUser,
      activeSession,
    );

    await walletService.releaseEscrowToSeller({
      wallet,
      grossAmount: gross,
      commissionAmount: commission,
      sellerAmount: sellerNet,
      context: {
        order: escrow.order,
        payment: escrow.payment,
        escrow: escrow._id,
        buyer: escrow.buyer,
        currency: escrow.currency,
        dispute: escrow.dispute,
      },
      session: activeSession,
      createdBy: actor?.id || null,
    });

    escrow.releasedAmount = roundMoney((escrow.releasedAmount || 0) + gross);
    escrow.undisputedAmount = 0;
    escrow.undisputedReleasedAt = new Date();
    // Keep held disputed funds; status remains locked/partial until dispute resolves
    if (activeSession) await escrow.save({ session: activeSession });
    else await escrow.save();

    if (escrow.dispute) {
      await disputeTimelineService.appendTimelineEvent({
        disputeId: escrow.dispute,
        orderId: escrow.order,
        event: DISPUTE_TIMELINE_EVENTS.ESCROW_RELEASED,
        actor,
        role: 'system',
        message: 'Undisputed escrow portion released to seller',
        meta: { amount: gross, reason },
        session: activeSession,
      });
    }

    return escrow;
  };

  if (session) return run(session);
  return withTransaction(run);
}

/**
 * Release disputed held portion after replacement accept / seller-wins.
 */
export async function releaseDisputedEscrowPortion(escrowId, {
  reason = 'dispute_resolved_release',
  actor = null,
  session = null,
  dispute = null,
} = {}) {
  const run = async (activeSession) => {
    // Always clear any remaining undisputed portion first (partial disputes).
    await releaseUndisputedEscrowPortion(escrowId, {
      reason: 'undisputed_on_dispute_resolution',
      actor,
      session: activeSession,
    });

    const escrow = await escrowRepository.findEscrowById(escrowId, { session: activeSession });
    if (!escrow) throw new AppError('Escrow not found', 404, { code: 'ESCROW_NOT_FOUND' });

    const gross = roundMoney(escrow.heldAmount || escrow.disputedAmount || 0);
    if (gross > 0) {
      const commission = roundMoney((gross * escrow.commissionPercent) / 100);
      const sellerNet = roundMoney(gross - commission);
      const wallet = await walletService.getOrCreateSellerWallet(
        escrow.seller,
        escrow.sellerUser,
        activeSession,
      );
      await walletService.releaseEscrowToSeller({
        wallet,
        grossAmount: gross,
        commissionAmount: commission,
        sellerAmount: sellerNet,
        context: {
          order: escrow.order,
          payment: escrow.payment,
          escrow: escrow._id,
          buyer: escrow.buyer,
          currency: escrow.currency,
          dispute: escrow.dispute,
        },
        session: activeSession,
        createdBy: actor?.id || null,
      });
      escrow.releasedAmount = roundMoney((escrow.releasedAmount || 0) + gross);
    }

    escrow.heldAmount = 0;
    escrow.disputedAmount = 0;
    escrow.status = ESCROW_STATUS.RELEASED;
    escrow.releasedAt = new Date();
    escrow.releaseReason = reason;
    escrow.releaseJobProcessedAt = new Date();
    if (activeSession) await escrow.save({ session: activeSession });
    else await escrow.save();

    const order = await orderRepository.findOrderById(escrow.order, { session: activeSession });
    if (order) {
      order.status = ORDER_STATUS.COMPLETED;
      order.completedAt = new Date();
      if (activeSession) await order.save({ session: activeSession });
      else await order.save();
    }

    if (dispute || escrow.dispute) {
      await disputeTimelineService.appendTimelineEvent({
        disputeId: dispute?._id || escrow.dispute,
        orderId: escrow.order,
        event: DISPUTE_TIMELINE_EVENTS.ESCROW_RELEASED,
        actor,
        role: actor ? 'admin' : 'system',
        message: 'Disputed escrow portion released to seller',
        meta: { amount: gross, reason },
        session: activeSession,
      });
    }

    return escrow;
  };

  if (session) return run(session);
  return withTransaction(run);
}

export async function markEscrowRefunded(escrowId, session = null) {
  const escrow = await escrowRepository.findEscrowById(escrowId, { session });
  if (!escrow) {
    throw new AppError('Escrow not found', 404, { code: 'ESCROW_NOT_FOUND' });
  }
  escrow.status = ESCROW_STATUS.REFUNDED;
  escrow.refundedAt = new Date();
  escrow.releaseJobProcessedAt = new Date();
  if (session) await escrow.save({ session });
  else await escrow.save();
  return escrow;
}

export async function processDueEscrowReleases({ limit = 100 } = {}) {
  const now = new Date();
  const fullCandidates = await escrowRepository.findReleaseCandidates(now, limit);
  const partialCandidates = await Escrow.find({
    status: ESCROW_STATUS.LOCKED,
    partialDispute: true,
    undisputedReleasedAt: null,
    undisputedAmount: { $gt: 0 },
    releaseAt: { $lte: now },
  })
    .sort({ releaseAt: 1 })
    .limit(limit)
    .lean();

  const results = { processed: 0, succeeded: 0, failed: 0, errors: [] };

  for (const escrow of fullCandidates) {
    results.processed += 1;
    try {
      const claimed = await Escrow.findOneAndUpdate(
        {
          _id: escrow._id,
          status: ESCROW_STATUS.LOCKED,
          dispute: null,
          releaseAt: { $lte: new Date() },
          releaseJobProcessedAt: null,
        },
        { $set: { releaseJobProcessedAt: new Date() } },
        { new: true },
      );

      if (!claimed) continue;

      try {
        await releaseEscrow(claimed._id, { reason: 'auto_release_24h' });
        results.succeeded += 1;
      } catch (error) {
        await Escrow.updateOne(
          { _id: claimed._id, status: ESCROW_STATUS.LOCKED },
          { $set: { releaseJobProcessedAt: null } },
        );
        throw error;
      }
    } catch (error) {
      results.failed += 1;
      results.errors.push({ escrowId: String(escrow._id), message: error.message });
    }
  }

  for (const escrow of partialCandidates) {
    results.processed += 1;
    try {
      await releaseUndisputedEscrowPortion(escrow._id, {
        reason: 'undisputed_auto_release_24h',
      });
      results.succeeded += 1;
    } catch (error) {
      results.failed += 1;
      results.errors.push({ escrowId: String(escrow._id), message: error.message });
    }
  }

  return results;
}

export async function listEscrows(query = {}, { admin = false, sellerId = null } = {}) {
  const pagination = parsePagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (sellerId) filter.seller = sellerId;
  if (query.sellerId && admin) filter.seller = query.sellerId;
  if (query.buyerId && admin) filter.buyer = query.buyerId;

  const { items, total } = await escrowRepository.listEscrows(filter, pagination);
  return { items, meta: buildPaginationMeta({ ...pagination, total }) };
}

export async function getEscrow(id) {
  const escrow = await Escrow.findById(id)
    .populate('order')
    .populate('payment')
    .populate('dispute')
    .lean();
  if (!escrow) {
    throw new AppError('Escrow not found', 404, { code: 'ESCROW_NOT_FOUND' });
  }
  return escrow;
}

export async function markOrderDelivered(orderId, actor) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404, { code: 'ORDER_NOT_FOUND' });
  }

  const isSeller = String(order.sellerUser) === String(actor.id);
  const isAdmin = actor.roles?.some((r) => ['admin', 'super_admin'].includes(r));
  if (!isSeller && !isAdmin) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }

  if (![ORDER_STATUS.ESCROW, ORDER_STATUS.PAID, ORDER_STATUS.DELIVERED].includes(order.status)) {
    throw new AppError('Order cannot be marked delivered in current status', 400, {
      code: 'ORDER_INVALID_STATUS',
    });
  }

  order.deliveryStatus = DELIVERY_STATUS.DELIVERED;
  order.deliveredAt = new Date();
  if (order.status === ORDER_STATUS.ESCROW || order.status === ORDER_STATUS.PAID) {
    order.status = ORDER_STATUS.DELIVERED;
  }
  await order.save();

  await logActivity({
    userId: actor.id,
    action: 'orders.delivered',
    resource: 'Order',
    resourceId: order._id,
  });

  return order.toObject();
}

export default {
  createPendingEscrow,
  lockEscrowAfterPayment,
  releaseEscrow,
  markEscrowDisputed,
  markEscrowRefunded,
  releaseUndisputedEscrowPortion,
  releaseDisputedEscrowPortion,
  processDueEscrowReleases,
  listEscrows,
  getEscrow,
  markOrderDelivered,
};
