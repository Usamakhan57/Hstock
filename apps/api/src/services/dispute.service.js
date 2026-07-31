import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../utils/transaction.js';
import { roundMoney } from '../helpers/money.helper.js';
import { generateDisputeNumber } from '../helpers/id.helper.js';
import {
  DISPUTE_STATUS,
  DISPUTE_RESOLUTION,
  ORDER_STATUS,
  ESCROW_STATUS,
} from '../constants/statuses.js';
import * as disputeRepository from '../repositories/dispute.repository.js';
import * as orderRepository from '../repositories/order.repository.js';
import * as escrowRepository from '../repositories/escrow.repository.js';
import * as escrowService from './escrow.service.js';
import * as refundService from './refund.service.js';
import { logActivity } from './activity.service.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { USER_ROLES } from '../constants/roles.js';

function isAdmin(actor) {
  return actor?.roles?.some((r) => [
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.SUPPORT,
  ].includes(r));
}

/**
 * Buyer opens a dispute — freezes escrow (no auto-release).
 */
export async function openDispute(payload, actor, requestMeta = {}) {
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

    await escrowService.markEscrowDisputed(escrow._id, dispute._id, session);

    order.status = ORDER_STATUS.DISPUTED;
    order.dispute = dispute._id;
    if (session) await order.save({ session });
    else await order.save();

    await logActivity({
      userId: actor.id,
      action: 'disputes.opened',
      resource: 'Dispute',
      resourceId: dispute._id,
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      meta: { orderId: order._id, reason: payload.reason },
      session,
    });

    return dispute.toObject();
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

export async function addDisputeMessage(id, payload, actor) {
  const dispute = await disputeRepository.findDisputeById(id);
  if (!dispute) {
    throw new AppError('Dispute not found', 404, { code: 'DISPUTE_NOT_FOUND' });
  }
  if ([DISPUTE_STATUS.RESOLVED, DISPUTE_STATUS.CLOSED].includes(dispute.status)) {
    throw new AppError('Dispute is closed', 400, { code: 'DISPUTE_CLOSED' });
  }

  let role = 'buyer';
  if (isAdmin(actor)) role = 'admin';
  else if (String(dispute.sellerUser) === String(actor.id)) role = 'seller';
  else if (String(dispute.buyer) !== String(actor.id)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }

  dispute.messages.push({
    author: actor.id,
    role,
    body: payload.body,
    attachments: payload.attachments || [],
  });
  if (dispute.status === DISPUTE_STATUS.OPEN && isAdmin(actor)) {
    dispute.status = DISPUTE_STATUS.UNDER_REVIEW;
  }
  await dispute.save();
  return dispute.toObject();
}

/**
 * Admin resolves dispute:
 * - seller_wins / release → release escrow to seller
 * - buyer_wins → full escrow refund
 * - partial_refund → refund amount, release remainder to seller
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
      // Clear dispute block then force release
      escrow.dispute = dispute._id;
      escrow.status = ESCROW_STATUS.LOCKED;
      if (session) await escrow.save({ session });
      else await escrow.save();

      await escrowService.releaseEscrow(escrow._id, {
        reason: `dispute_${resolution}`,
        actor,
        session,
        force: true,
      });
    } else if (resolution === DISPUTE_RESOLUTION.BUYER_WINS) {
      refundAmount = escrow.amount;
      await refundService.createEscrowRefund({
        order,
        escrow,
        dispute,
        amount: refundAmount,
        type: 'full',
        reason: payload.note || 'Dispute resolved — buyer wins',
        actor,
        session,
      });
    } else if (resolution === DISPUTE_RESOLUTION.PARTIAL_REFUND) {
      refundAmount = roundMoney(payload.refundAmount);
      const originalEscrowAmount = escrow.amount;
      if (!(refundAmount > 0) || refundAmount >= originalEscrowAmount) {
        throw new AppError('Partial refund amount must be > 0 and < escrow amount', 400, {
          code: 'INVALID_REFUND_AMOUNT',
        });
      }

      await refundService.createEscrowRefund({
        order,
        escrow,
        dispute,
        amount: refundAmount,
        type: 'partial',
        reason: payload.note || 'Dispute resolved — partial refund',
        actor,
        session,
      });

      const updatedEscrow = await escrowRepository.findEscrowById(dispute.escrow, { session });
      const remainder = roundMoney(updatedEscrow.amount);
      if (remainder > 0) {
        updatedEscrow.commissionAmount = roundMoney(
          (remainder * updatedEscrow.commissionPercent) / 100,
        );
        updatedEscrow.sellerAmount = roundMoney(
          remainder - updatedEscrow.commissionAmount,
        );
        updatedEscrow.status = ESCROW_STATUS.LOCKED;
        updatedEscrow.dispute = null;
        if (session) await updatedEscrow.save({ session });
        else await updatedEscrow.save();

        await escrowService.releaseEscrow(updatedEscrow._id, {
          reason: 'dispute_partial_refund_remainder',
          actor,
          session,
          force: true,
        });
      }
    }

    dispute.status = DISPUTE_STATUS.RESOLVED;
    dispute.resolution = resolution;
    dispute.resolutionNote = payload.note || null;
    dispute.refundAmount = refundAmount;
    dispute.resolvedAt = new Date();
    dispute.resolvedBy = actor.id;
    dispute.messages.push({
      author: actor.id,
      role: 'admin',
      body: payload.note || `Resolved: ${resolution}`,
    });
    if (session) await dispute.save({ session });
    else await dispute.save();

    await logActivity({
      userId: actor.id,
      action: 'disputes.resolved',
      resource: 'Dispute',
      resourceId: dispute._id,
      meta: { resolution, refundAmount },
      session,
    });

    return dispute.toObject();
  });
}

export default {
  openDispute,
  listDisputes,
  getDispute,
  addDisputeMessage,
  resolveDispute,
};
