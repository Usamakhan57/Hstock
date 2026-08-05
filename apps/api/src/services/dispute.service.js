import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../utils/transaction.js';
import { roundMoney } from '../helpers/money.helper.js';
import { addHours, isPast } from '../helpers/date.helper.js';
import { generateDisputeNumber } from '../helpers/id.helper.js';
import { env } from '../config/env.js';
import {
  DISPUTE_STATUS,
  DISPUTE_RESOLUTION,
  ORDER_STATUS,
  ESCROW_STATUS,
  DELIVERY_STATUS,
} from '../constants/statuses.js';
import {
  DISPUTE_TIMELINE_EVENTS,
  ORDER_ACCOUNT_STATUS,
} from '../constants/disputeFinal.js';
import * as disputeRepository from '../repositories/dispute.repository.js';
import * as orderRepository from '../repositories/order.repository.js';
import * as escrowRepository from '../repositories/escrow.repository.js';
import * as escrowService from './escrow.service.js';
import * as refundService from './refund.service.js';
import { logActivity } from './activity.service.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { USER_ROLES } from '../constants/roles.js';
import {
  CONTACT_FILTER_CODE,
  CONTACT_FILTER_MESSAGE,
} from '../constants/disputeChat.js';
import { detectBlockedContent } from '../helpers/contentFilter.helper.js';
import {
  Dispute,
  DisputeChatMessage,
  DisputeChatViolation,
  DisputeReplacement,
  Escrow,
  Order,
} from '../models/index.js';
import * as disputeChatService from './disputeChat.service.js';
import * as disputeTimelineService from './disputeTimeline.service.js';
import { emitDomainEvent } from '../events/bus.js';
import { DOMAIN_EVENTS } from '../constants/events.js';

function isAdmin(actor) {
  return actor?.roles?.some((r) => [
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.SUPPORT,
  ].includes(r));
}

function isSuperAdmin(actor) {
  return actor?.roles?.includes(USER_ROLES.SUPER_ADMIN);
}

/**
 * Buyer opens a dispute — supports partial quantity.
 * Only disputed amount is held; undisputed continues normal escrow flow.
 * Auto-creates private secure dispute chat.
 */
export async function openDispute(payload, actor, requestMeta = {}) {
  const contactScan = detectBlockedContent(
    `${payload.reason || ''}\n${payload.description || ''}`,
  );
  if (contactScan.blocked) {
    throw new AppError(CONTACT_FILTER_MESSAGE, 400, {
      code: CONTACT_FILTER_CODE,
      details: { rules: contactScan.rules },
    });
  }

  return withTransaction(async (session) => {
    const order = await orderRepository.findOrderById(payload.orderId, { session });
    if (!order) {
      throw new AppError('Order not found', 404, { code: 'ORDER_NOT_FOUND' });
    }

    if (String(order.buyer) !== String(actor.id) && !isAdmin(actor)) {
      throw new AppError('Only the buyer can open a dispute', 403, { code: 'FORBIDDEN' });
    }

    if (![
      ORDER_STATUS.PAID,
      ORDER_STATUS.ESCROW,
      ORDER_STATUS.DELIVERED,
    ].includes(order.status)) {
      throw new AppError('Order cannot be disputed in current status', 400, {
        code: 'ORDER_NOT_DISPUTABLE',
      });
    }

    // Inspection period starts at delivery — disputes are not allowed before credentials arrive.
    if (order.deliveryStatus !== DELIVERY_STATUS.DELIVERED || !order.deliveredAt) {
      throw new AppError('Order must be delivered before opening a dispute', 400, {
        code: 'ORDER_NOT_DELIVERED',
      });
    }

    const existing = await disputeRepository.findDisputeByOrder(order._id, { session });
    if (existing) {
      throw new AppError('A dispute already exists for this order', 409, {
        code: 'DISPUTE_EXISTS',
      });
    }

    const escrow = await escrowRepository.findEscrowByOrder(order._id, { session });
    if (!escrow) {
      throw new AppError('Escrow not found for order', 404, { code: 'ESCROW_NOT_FOUND' });
    }
    if ([ESCROW_STATUS.RELEASED, ESCROW_STATUS.REFUNDED].includes(escrow.status)) {
      throw new AppError('Escrow is already closed', 400, { code: 'ESCROW_CLOSED' });
    }
    // Timer #1 expired without dispute → funds are eligible for auto-release; do not open late disputes.
    if (escrow.releaseAt && isPast(escrow.releaseAt)) {
      throw new AppError('Inspection period has expired', 400, {
        code: 'INSPECTION_EXPIRED',
      });
    }

    const orderQuantity = order.quantity || 1;
    let disputedAccountIds = payload.disputedAccountIds || [];
    let disputedQuantity = payload.disputedQuantity;

    if (disputedAccountIds.length) {
      const validIds = new Set((order.accounts || []).map((a) => String(a._id)));
      for (const id of disputedAccountIds) {
        if (!validIds.has(String(id))) {
          throw new AppError('Invalid disputed account id', 400, {
            code: 'INVALID_ACCOUNT_ID',
          });
        }
      }
      disputedQuantity = disputedAccountIds.length;
    }

    if (!disputedQuantity) disputedQuantity = orderQuantity;
    disputedQuantity = Number(disputedQuantity);

    if (!(disputedQuantity >= 1) || disputedQuantity > orderQuantity) {
      throw new AppError('Invalid disputed quantity', 400, {
        code: 'INVALID_DISPUTED_QUANTITY',
        details: { orderQuantity, disputedQuantity },
      });
    }

    const isPartial = disputedQuantity < orderQuantity;
    const unitPrice = roundMoney(order.unitPrice);
    const disputedAmount = roundMoney(unitPrice * disputedQuantity);
    const expireAt = new Date(
      Date.now() + (env.DISPUTE_CREDENTIAL_TTL_DAYS || 30) * 24 * 60 * 60 * 1000,
    );

    if (disputedAccountIds.length && order.accounts?.length) {
      for (const account of order.accounts) {
        if (disputedAccountIds.some((id) => String(id) === String(account._id))) {
          account.status = ORDER_ACCOUNT_STATUS.DISPUTED;
        }
      }
      if (session) await order.save({ session });
      else await order.save();
    }

    const dispute = await disputeRepository.createDispute(
      {
        disputeNumber: generateDisputeNumber(),
        order: order._id,
        escrow: escrow._id,
        buyer: order.buyer,
        seller: order.seller,
        sellerUser: order.sellerUser,
        reason: payload.reason,
        description: payload.description,
        evidence: payload.evidence || [],
        status: DISPUTE_STATUS.OPEN,
        orderQuantity,
        disputedQuantity,
        resolvedQuantity: 0,
        replacementQuantity: 0,
        refundQuantity: 0,
        releasedQuantity: 0,
        heldQuantity: disputedQuantity,
        remainingQuantity: disputedQuantity,
        unitPrice,
        disputedAmount,
        disputedAccountIds,
        isPartial,
        credentialsExpireAt: expireAt,
        openedAt: new Date(),
        sellerResponseDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        replacementAttempts: 0,
        maxReplacementAttempts: 3,
        messages: [
          {
            author: actor.id,
            role: 'buyer',
            body: payload.description,
            attachments: payload.evidence || [],
          },
        ],
      },
      session,
    );

    const chat = await disputeChatService.createDisputeChat(dispute, {
      session,
      actor,
      requestMeta,
    });
    chat.credentialsExpireAt = expireAt;
    if (session) await chat.save({ session });
    else await chat.save();

    const opening = {
      chat: chat._id,
      dispute: dispute._id,
      order: order._id,
      author: actor.id,
      role: 'buyer',
      body: payload.description,
      attachments: (payload.evidence || []).map((url) => ({
        url,
        filename: null,
        extension: null,
      })),
    };
    if (session) await DisputeChatMessage.create([opening], { session });
    else await DisputeChatMessage.create(opening);

    chat.messageCount = (chat.messageCount || 1) + 1;
    chat.lastMessageAt = new Date();
    if (session) await chat.save({ session });
    else await chat.save();

    dispute.chat = chat._id;
    if (session) await dispute.save({ session });
    else await dispute.save();

    await escrowService.markEscrowDisputed(escrow._id, dispute._id, session, {
      disputedAmount,
      isPartial,
    });

    order.status = ORDER_STATUS.DISPUTED;
    order.dispute = dispute._id;
    if (session) await order.save({ session });
    else await order.save();

    await disputeTimelineService.appendTimelineEvent({
      disputeId: dispute._id,
      orderId: order._id,
      event: DISPUTE_TIMELINE_EVENTS.DISPUTE_CREATED,
      actor,
      role: 'buyer',
      message: 'Dispute opened',
      meta: { reason: payload.reason, isPartial },
      session,
    });
    await disputeTimelineService.appendTimelineEvent({
      disputeId: dispute._id,
      orderId: order._id,
      event: DISPUTE_TIMELINE_EVENTS.QUANTITY_SELECTED,
      actor,
      role: 'buyer',
      message: `Disputed quantity ${disputedQuantity} of ${orderQuantity}`,
      meta: { disputedQuantity, orderQuantity, disputedAmount },
      session,
    });
    await disputeTimelineService.appendTimelineEvent({
      disputeId: dispute._id,
      orderId: order._id,
      event: DISPUTE_TIMELINE_EVENTS.CHAT_STARTED,
      actor,
      role: 'system',
      message: 'Secure dispute chat created',
      meta: { chatId: chat._id },
      session,
    });
    if (payload.evidence?.length) {
      await disputeTimelineService.appendTimelineEvent({
        disputeId: dispute._id,
        orderId: order._id,
        event: DISPUTE_TIMELINE_EVENTS.EVIDENCE_UPLOADED,
        actor,
        role: 'buyer',
        message: 'Initial evidence attached',
        meta: { count: payload.evidence.length },
        session,
      });
    }

    await logActivity({
      userId: actor.id,
      action: 'disputes.opened',
      resource: 'Dispute',
      resourceId: dispute._id,
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      meta: {
        orderId: order._id,
        reason: payload.reason,
        chatId: chat._id,
        disputedQuantity,
        disputedAmount,
        isPartial,
      },
      session,
    });

    const obj = dispute.toObject();
    obj.chat = chat._id;
    emitDomainEvent(DOMAIN_EVENTS.DISPUTE_OPENED, {
      dispute: obj,
      order: order.toObject ? order.toObject() : order,
    });
    return obj;
  });
}

export async function listDisputes(query = {}, actor) {
  const pagination = parsePagination(query);
  const filter = {};

  if (isAdmin(actor)) {
    if (query.status) filter.status = query.status;
    if (query.buyerId) filter.buyer = query.buyerId;
    if (query.sellerId) filter.seller = query.sellerId;
  } else if (actor.roles?.includes(USER_ROLES.SELLER) && query.scope === 'seller') {
    filter.sellerUser = actor.id;
    if (query.status) filter.status = query.status;
  } else {
    filter.buyer = actor.id;
    if (query.status) filter.status = query.status;
  }

  const { items, total } = await disputeRepository.listDisputes(filter, pagination);
  return { items, meta: buildPaginationMeta({ ...pagination, total }) };
}

export async function getDispute(id, actor) {
  const dispute = await disputeRepository.findDisputeById(id, { lean: true });
  if (!dispute) {
    throw new AppError('Dispute not found', 404, { code: 'DISPUTE_NOT_FOUND' });
  }

  const allowed = isAdmin(actor)
    || String(dispute.buyer) === String(actor.id)
    || String(dispute.sellerUser) === String(actor.id);
  if (!allowed) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  return dispute;
}

/**
 * Admin dashboard payload for a dispute.
 */
export async function getDisputeDashboard(id, actor) {
  if (!isAdmin(actor) && !isSuperAdmin(actor)) {
    // buyer/seller can view summary for their dispute
    const dispute = await getDispute(id, actor);
    return buildDashboard(dispute);
  }
  const dispute = await Dispute.findById(id).lean();
  if (!dispute) throw new AppError('Dispute not found', 404, { code: 'DISPUTE_NOT_FOUND' });
  return buildDashboard(dispute);
}

async function buildDashboard(dispute) {
  const [escrow, order, replacements, violation, timeline] = await Promise.all([
    Escrow.findById(dispute.escrow).lean(),
    Order.findById(dispute.order).lean(),
    DisputeReplacement.find({ dispute: dispute._id }).sort({ version: 1 }).lean(),
    DisputeChatViolation.findOne({ user: dispute.buyer }).lean(),
    disputeTimelineService.listTimeline(dispute._id),
  ]);

  return {
    disputeId: dispute._id,
    disputeNumber: dispute.disputeNumber,
    status: dispute.status,
    isPartial: dispute.isPartial,
    orderQuantity: dispute.orderQuantity,
    disputedQuantity: dispute.disputedQuantity,
    resolvedQuantity: dispute.resolvedQuantity,
    replacementQuantity: dispute.replacementQuantity,
    refundQuantity: dispute.refundQuantity,
    releasedQuantity: dispute.releasedQuantity,
    heldQuantity: dispute.heldQuantity,
    remainingQuantity: dispute.remainingQuantity,
    unitPrice: dispute.unitPrice,
    disputedAmount: dispute.disputedAmount,
    amounts: {
      orderTotal: order?.totalAmount ?? null,
      disputed: dispute.disputedAmount,
      held: escrow?.heldAmount ?? dispute.disputedAmount,
      released: escrow?.releasedAmount ?? 0,
      refunded: escrow?.refundedAmount ?? dispute.refundAmount ?? 0,
      undisputed: escrow?.undisputedAmount ?? 0,
    },
    timers: {
      inspectionStartedAt: escrow?.metadata?.inspectionStartedAt || order?.deliveredAt || null,
      inspectionReleaseAt: escrow?.releaseAt || null,
      sellerResponseDeadline: dispute.sellerResponseDeadline || null,
      deliveredAt: order?.deliveredAt || null,
      openedAt: dispute.openedAt || null,
      firstReplacementAt: dispute.firstReplacementAt || null,
    },
    ocrFlagCount: dispute.ocrFlagCount || 0,
    violationCount: violation?.count || dispute.violationCountSnapshot || 0,
    replacementAttempts: dispute.replacementAttempts ?? dispute.latestReplacementVersion ?? 0,
    maxReplacementAttempts: dispute.maxReplacementAttempts ?? 3,
    canReplace: (dispute.replacementAttempts ?? dispute.latestReplacementVersion ?? 0)
      < (dispute.maxReplacementAttempts ?? 3)
      && ![
        DISPUTE_STATUS.MAXIMUM_REPLACEMENTS_REACHED,
        DISPUTE_STATUS.RESOLVED,
        DISPUTE_STATUS.CLOSED,
        DISPUTE_STATUS.WAITING_FOR_BUYER_CONFIRMATION,
      ].includes(dispute.status),
    replacementHistory: replacements.map((r) => ({
      id: r._id,
      version: r.version,
      status: r.status,
      accountCount: r.accountCount,
      createdAt: r.createdAt,
      respondedAt: r.respondedAt,
    })),
    timeline,
    assignedAdmin: dispute.assignedAdmin,
  };
}

export async function getDisputeTimeline(id, actor) {
  await getDispute(id, actor);
  return disputeTimelineService.listTimeline(id);
}

/**
 * Backward-compatible message endpoint — routes through secure dispute chat filter.
 */
export async function addDisputeMessage(id, payload, actor, requestMeta = {}) {
  const chat = await disputeChatService.getChatByDisputeId(id);
  if (!chat) {
    throw new AppError('Dispute chat not found', 404, { code: 'CHAT_NOT_FOUND' });
  }

  if (isAdmin(actor)) {
    const actorId = String(actor.id);
    const isAssigned = chat.assignedAdmin && String(chat.assignedAdmin) === actorId;
    const isSuper = actor.roles?.includes(USER_ROLES.SUPER_ADMIN);
    if (!isAssigned && !isSuper) {
      await disputeChatService.assignAdmin(id, actor, requestMeta);
    }
  }

  const message = await disputeChatService.sendMessage(id, payload, actor, requestMeta);
  const dispute = await disputeRepository.findDisputeById(id, { lean: true });
  return { dispute, message };
}

/**
 * Admin resolves dispute (full or partial refund / seller wins).
 */
export async function resolveDispute(id, payload, actor) {
  if (!actor?.roles?.some((r) => [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(r))) {
    throw new AppError('Only admins can resolve disputes', 403, { code: 'FORBIDDEN' });
  }

  const resolution = payload.resolution;
  if (!Object.values(DISPUTE_RESOLUTION).includes(resolution)) {
    throw new AppError('Invalid dispute resolution', 400, { code: 'INVALID_RESOLUTION' });
  }

  return withTransaction(async (session) => {
    const dispute = await disputeRepository.findDisputeById(id, { session });
    if (!dispute) {
      throw new AppError('Dispute not found', 404, { code: 'DISPUTE_NOT_FOUND' });
    }
    if ([DISPUTE_STATUS.RESOLVED, DISPUTE_STATUS.CLOSED].includes(dispute.status)) {
      throw new AppError('Dispute already resolved', 400, { code: 'DISPUTE_RESOLVED' });
    }

    const escrow = await escrowRepository.findEscrowById(dispute.escrow, { session });
    if (!escrow) {
      throw new AppError('Escrow not found', 404, { code: 'ESCROW_NOT_FOUND' });
    }

    const order = await orderRepository.findOrderById(dispute.order, { session });
    let refundAmount = null;

    if (resolution === DISPUTE_RESOLUTION.SELLER_WINS || resolution === DISPUTE_RESOLUTION.RELEASE) {
      await escrowService.releaseDisputedEscrowPortion(escrow._id, {
        reason: `dispute_${resolution}`,
        actor,
        session,
        dispute,
      });
      dispute.releasedQuantity = dispute.disputedQuantity;
      dispute.heldQuantity = 0;
      dispute.remainingQuantity = 0;
      dispute.resolvedQuantity = dispute.disputedQuantity;
    } else if (resolution === DISPUTE_RESOLUTION.BUYER_WINS) {
      // Release any undisputed portion to seller first — never refund unaffected accounts.
      await escrowService.releaseUndisputedEscrowPortion(escrow._id, {
        reason: 'undisputed_on_buyer_wins',
        actor,
        session,
      });
      const heldEscrow = await escrowRepository.findEscrowById(dispute.escrow, { session });

      refundAmount = roundMoney(
        heldEscrow.heldAmount || dispute.disputedAmount || heldEscrow.amount,
      );
      const refundType = refundAmount >= roundMoney(heldEscrow.amount)
        && !(heldEscrow.releasedAmount > 0)
        ? 'full'
        : 'partial';
      await refundService.createEscrowRefund({
        order,
        escrow: heldEscrow,
        dispute,
        amount: refundAmount,
        type: refundType,
        reason: payload.note || 'Dispute resolved — buyer wins (disputed portion)',
        actor,
        session,
      });
      heldEscrow.refundedAmount = roundMoney((heldEscrow.refundedAmount || 0) + refundAmount);
      heldEscrow.heldAmount = 0;
      heldEscrow.disputedAmount = 0;
      if (refundType === 'full') {
        heldEscrow.status = ESCROW_STATUS.REFUNDED;
        heldEscrow.refundedAt = new Date();
        order.status = ORDER_STATUS.REFUNDED;
      } else {
        heldEscrow.status = ESCROW_STATUS.RELEASED;
        heldEscrow.releasedAt = new Date();
        order.status = ORDER_STATUS.COMPLETED;
      }
      if (session) {
        await heldEscrow.save({ session });
        await order.save({ session });
      } else {
        await heldEscrow.save();
        await order.save();
      }

      dispute.refundQuantity = dispute.disputedQuantity;
      dispute.refundAmount = refundAmount;
      dispute.heldQuantity = 0;
      dispute.remainingQuantity = 0;
      dispute.resolvedQuantity = dispute.disputedQuantity;
    } else if (resolution === DISPUTE_RESOLUTION.PARTIAL_REFUND) {
      refundAmount = roundMoney(payload.refundAmount);
      const maxRefund = roundMoney(escrow.heldAmount || dispute.disputedAmount);
      if (!(refundAmount > 0) || refundAmount > maxRefund) {
        throw new AppError('Partial refund must be > 0 and <= disputed held amount', 400, {
          code: 'INVALID_REFUND_AMOUNT',
          details: { maxRefund },
        });
      }

      await refundService.createEscrowRefund({
        order,
        escrow,
        dispute,
        amount: refundAmount,
        type: 'partial',
        reason: payload.note || 'Dispute resolved — partial refund of disputed items',
        actor,
        session,
      });

      const remainderHeld = roundMoney(maxRefund - refundAmount);
      escrow.refundedAmount = roundMoney((escrow.refundedAmount || 0) + refundAmount);
      escrow.heldAmount = remainderHeld;
      escrow.disputedAmount = remainderHeld;
      if (session) await escrow.save({ session });
      else await escrow.save();

      if (remainderHeld > 0) {
        await escrowService.releaseDisputedEscrowPortion(escrow._id, {
          reason: 'dispute_partial_refund_remainder_to_seller',
          actor,
          session,
          dispute,
        });
      }

      const refundQty = Math.max(
        1,
        Math.min(
          dispute.disputedQuantity,
          Math.round(refundAmount / (dispute.unitPrice || refundAmount)),
        ),
      );
      dispute.refundQuantity = refundQty;
      dispute.refundAmount = refundAmount;
      dispute.releasedQuantity = Math.max(0, dispute.disputedQuantity - refundQty);
      dispute.heldQuantity = 0;
      dispute.remainingQuantity = 0;
      dispute.resolvedQuantity = dispute.disputedQuantity;
    }

    dispute.status = DISPUTE_STATUS.RESOLVED;
    dispute.resolution = resolution;
    dispute.resolutionNote = payload.note || null;
    dispute.resolvedAt = new Date();
    dispute.resolvedBy = actor.id;
    dispute.messages.push({
      author: actor.id,
      role: 'admin',
      body: payload.note || `Resolved: ${resolution}`,
    });
    if (session) await dispute.save({ session });
    else await dispute.save();

    await disputeChatService.setChatReadOnly(dispute._id, {
      session,
      expireCredentials: true,
    });

    await disputeTimelineService.appendTimelineEvent({
      disputeId: dispute._id,
      orderId: dispute.order,
      event: DISPUTE_TIMELINE_EVENTS.ADMIN_DECISION,
      actor,
      role: 'admin',
      message: `Admin resolved dispute: ${resolution}`,
      meta: { resolution, refundAmount },
      session,
    });
    if (refundAmount) {
      await disputeTimelineService.appendTimelineEvent({
        disputeId: dispute._id,
        orderId: dispute.order,
        event: DISPUTE_TIMELINE_EVENTS.REFUND_APPROVED,
        actor,
        role: 'admin',
        message: `Refund approved: ${refundAmount}`,
        meta: { refundAmount },
        session,
      });
    }
    await disputeTimelineService.appendTimelineEvent({
      disputeId: dispute._id,
      orderId: dispute.order,
      event: DISPUTE_TIMELINE_EVENTS.DISPUTE_CLOSED,
      actor,
      role: 'admin',
      message: 'Dispute closed',
      meta: { resolution },
      session,
    });

    await logActivity({
      userId: actor.id,
      action: 'disputes.resolved',
      resource: 'Dispute',
      resourceId: dispute._id,
      meta: { resolution, refundAmount },
      session,
    });

    const disputeObj = dispute.toObject();
    emitDomainEvent(DOMAIN_EVENTS.DISPUTE_RESOLVED, {
      dispute: disputeObj,
      order: order?.toObject ? order.toObject() : order,
      resolution,
    });
    return disputeObj;
  });
}

/**
 * 24h auto-refund jobs:
 * 1) Seller never submitted any replacement (open + no replacements).
 * 2) Buyer rejected all 3 replacements (maximum_replacements_reached + deadline).
 * Once a replacement exists, case (1) never auto-refunds.
 */
export async function processUnansweredDisputeAutoRefunds({ limit = 50 } = {}) {
  const now = new Date();
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  const noReplacementCandidates = await Dispute.find({
    status: DISPUTE_STATUS.OPEN,
    latestReplacementVersion: { $lte: 0 },
    firstReplacementAt: null,
    autoRefundedAt: null,
    sellerResponseDeadline: { $lte: now },
  })
    .sort({ sellerResponseDeadline: 1 })
    .limit(limit);

  for (const dispute of noReplacementCandidates) {
    results.processed += 1;
    try {
      if ((dispute.latestReplacementVersion || 0) > 0 || dispute.firstReplacementAt) {
        continue;
      }
      await autoRefundDisputeForBuyer({
        disputeId: dispute._id,
        expectedStatus: DISPUTE_STATUS.OPEN,
        requireNoReplacement: true,
        reason: 'Auto-refund: seller did not submit a replacement within 24 hours',
        timelineReason: 'no_replacement_within_24h',
      });
      results.succeeded += 1;
    } catch (error) {
      results.failed += 1;
      results.errors.push({
        disputeId: String(dispute._id),
        message: error.message,
      });
    }
  }

  const remaining = Math.max(0, limit - results.processed);
  if (remaining > 0) {
    const maxReachedCandidates = await Dispute.find({
      status: DISPUTE_STATUS.MAXIMUM_REPLACEMENTS_REACHED,
      autoRefundedAt: null,
      sellerResponseDeadline: { $lte: now },
    })
      .sort({ sellerResponseDeadline: 1 })
      .limit(remaining);

    for (const dispute of maxReachedCandidates) {
      results.processed += 1;
      try {
        await autoRefundDisputeForBuyer({
          disputeId: dispute._id,
          expectedStatus: DISPUTE_STATUS.MAXIMUM_REPLACEMENTS_REACHED,
          requireNoReplacement: false,
          reason: 'Auto-refund: maximum replacement attempts reached',
          timelineReason: 'maximum_replacements_reached',
        });
        results.succeeded += 1;
      } catch (error) {
        results.failed += 1;
        results.errors.push({
          disputeId: String(dispute._id),
          message: error.message,
        });
      }
    }
  }

  return results;
}

async function autoRefundDisputeForBuyer({
  disputeId,
  expectedStatus,
  requireNoReplacement,
  reason,
  timelineReason,
}) {
  const systemActor = {
    id: null,
    _id: null,
    roles: [USER_ROLES.SUPER_ADMIN],
  };

  return withTransaction(async (session) => {
    const dispute = await disputeRepository.findDisputeById(disputeId, { session });
    if (!dispute) {
      throw new AppError('Dispute not found', 404, { code: 'DISPUTE_NOT_FOUND' });
    }
    if (dispute.status !== expectedStatus) {
      throw new AppError('Dispute is not eligible for auto-refund', 400, {
        code: 'DISPUTE_NOT_ELIGIBLE',
      });
    }
    if (requireNoReplacement
      && ((dispute.latestReplacementVersion || 0) > 0 || dispute.firstReplacementAt)) {
      throw new AppError('Replacement already submitted — auto-refund blocked', 400, {
        code: 'REPLACEMENT_EXISTS',
      });
    }
    if (dispute.autoRefundedAt) {
      throw new AppError('Dispute already auto-refunded', 400, { code: 'ALREADY_AUTO_REFUNDED' });
    }

    const escrow = await escrowRepository.findEscrowById(dispute.escrow, { session });
    if (!escrow) {
      throw new AppError('Escrow not found', 404, { code: 'ESCROW_NOT_FOUND' });
    }
    const order = await orderRepository.findOrderById(dispute.order, { session });

    await escrowService.releaseUndisputedEscrowPortion(escrow._id, {
      reason: 'undisputed_on_auto_refund',
      actor: systemActor,
      session,
    });
    const heldEscrow = await escrowRepository.findEscrowById(dispute.escrow, { session });

    const refundAmount = roundMoney(
      heldEscrow.heldAmount || dispute.disputedAmount || heldEscrow.amount,
    );
    const refundType = refundAmount >= roundMoney(heldEscrow.amount)
      && !(heldEscrow.releasedAmount > 0)
      ? 'full'
      : 'partial';

    await refundService.createEscrowRefund({
      order,
      escrow: heldEscrow,
      dispute,
      amount: refundAmount,
      type: refundType,
      reason,
      actor: systemActor,
      session,
    });

    heldEscrow.refundedAmount = roundMoney((heldEscrow.refundedAmount || 0) + refundAmount);
    heldEscrow.heldAmount = 0;
    heldEscrow.disputedAmount = 0;
    if (refundType === 'full') {
      heldEscrow.status = ESCROW_STATUS.REFUNDED;
      heldEscrow.refundedAt = new Date();
      order.status = ORDER_STATUS.REFUNDED;
    } else {
      heldEscrow.status = ESCROW_STATUS.RELEASED;
      heldEscrow.releasedAt = new Date();
      order.status = ORDER_STATUS.COMPLETED;
    }
    if (session) {
      await heldEscrow.save({ session });
      await order.save({ session });
    } else {
      await heldEscrow.save();
      await order.save();
    }

    dispute.refundQuantity = dispute.disputedQuantity;
    dispute.refundAmount = refundAmount;
    dispute.heldQuantity = 0;
    dispute.remainingQuantity = 0;
    dispute.resolvedQuantity = dispute.disputedQuantity;
    dispute.status = DISPUTE_STATUS.RESOLVED;
    dispute.resolution = DISPUTE_RESOLUTION.BUYER_WINS;
    dispute.resolutionNote = reason;
    dispute.resolvedAt = new Date();
    dispute.autoRefundedAt = new Date();
    if (session) await dispute.save({ session });
    else await dispute.save();

    await disputeChatService.setChatReadOnly(dispute._id, { session, expireCredentials: true });

    await disputeTimelineService.appendTimelineEvent({
      disputeId: dispute._id,
      orderId: dispute.order,
      event: DISPUTE_TIMELINE_EVENTS.REFUND_ISSUED,
      actor: systemActor,
      role: 'system',
      message: `Auto-refund issued: ${refundAmount}`,
      meta: { refundAmount, reason: timelineReason },
      session,
    });
    await disputeTimelineService.appendTimelineEvent({
      disputeId: dispute._id,
      orderId: dispute.order,
      event: DISPUTE_TIMELINE_EVENTS.DISPUTE_CLOSED,
      actor: systemActor,
      role: 'system',
      message: 'Dispute closed after automatic refund',
      meta: { resolution: DISPUTE_RESOLUTION.BUYER_WINS },
      session,
    });

    const disputeObj = dispute.toObject();
    emitDomainEvent(DOMAIN_EVENTS.DISPUTE_RESOLVED, {
      dispute: disputeObj,
      order: order?.toObject ? order.toObject() : order,
      resolution: DISPUTE_RESOLUTION.BUYER_WINS,
    });
    return disputeObj;
  });
}


/**
 * Admin: extend Timer #2 (seller replacement window).
 * Does not affect Timer #1 (inspection / auto-release).
 */
export async function extendSellerReplacementDeadline(disputeId, payload, actor) {
  if (!isAdmin(actor) && !isSuperAdmin(actor)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }

  const dispute = await Dispute.findById(disputeId);
  if (!dispute) {
    throw new AppError('Dispute not found', 404, { code: 'DISPUTE_NOT_FOUND' });
  }
  if ([DISPUTE_STATUS.RESOLVED, DISPUTE_STATUS.CLOSED].includes(dispute.status)) {
    throw new AppError('Cannot extend deadline on a closed dispute', 400, {
      code: 'DISPUTE_CLOSED',
    });
  }

  const hours = Number(payload?.hours);
  const until = payload?.until ? new Date(payload.until) : null;
  let nextDeadline;
  if (until && !Number.isNaN(until.getTime())) {
    nextDeadline = until;
  } else if (Number.isFinite(hours) && hours > 0) {
    const base = dispute.sellerResponseDeadline && !isPast(dispute.sellerResponseDeadline)
      ? dispute.sellerResponseDeadline
      : new Date();
    nextDeadline = addHours(base, hours);
  } else {
    throw new AppError('Provide hours (>0) or until (ISO date)', 400, {
      code: 'INVALID_EXTENSION',
    });
  }

  if (nextDeadline.getTime() <= Date.now()) {
    throw new AppError('Extended deadline must be in the future', 400, {
      code: 'INVALID_EXTENSION',
    });
  }

  const previous = dispute.sellerResponseDeadline;
  dispute.sellerResponseDeadline = nextDeadline;
  await dispute.save();

  await logActivity({
    userId: actor.id,
    action: 'disputes.extend_replacement_deadline',
    resource: 'Dispute',
    resourceId: dispute._id,
    meta: {
      previousDeadline: previous,
      sellerResponseDeadline: nextDeadline,
      hours: Number.isFinite(hours) ? hours : null,
    },
  });

  await disputeTimelineService.appendTimelineEvent({
    disputeId: dispute._id,
    orderId: dispute.order,
    event: DISPUTE_TIMELINE_EVENTS.ADMIN_DECISION,
    actor,
    role: 'admin',
    message: 'Admin extended seller replacement deadline',
    meta: {
      previousDeadline: previous,
      sellerResponseDeadline: nextDeadline,
    },
  });

  return {
    disputeId: dispute._id,
    status: dispute.status,
    previousDeadline: previous,
    sellerResponseDeadline: nextDeadline,
  };
}

export default {
  openDispute,
  listDisputes,
  getDispute,
  getDisputeDashboard,
  getDisputeTimeline,
  addDisputeMessage,
  resolveDispute,
  extendSellerReplacementDeadline,
  processUnansweredDisputeAutoRefunds,
};
