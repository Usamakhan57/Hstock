import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../utils/transaction.js';
import { roundMoney } from '../helpers/money.helper.js';
import { generateRefundNumber } from '../helpers/id.helper.js';
import {
  REFUND_STATUS,
  REFUND_TYPE,
  ORDER_STATUS,
  PAYMENT_STATUS,
  ESCROW_STATUS,
} from '../constants/statuses.js';
import * as refundRepository from '../repositories/refund.repository.js';
import * as orderRepository from '../repositories/order.repository.js';
import * as escrowRepository from '../repositories/escrow.repository.js';
import * as paymentRepository from '../repositories/payment.repository.js';
import * as walletService from './wallet.service.js';
import * as escrowService from './escrow.service.js';
import { logActivity } from './activity.service.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { USER_ROLES } from '../constants/roles.js';

function isAdmin(actor) {
  return actor?.roles?.some((r) => [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(r));
}

/**
 * Internal escrow refund used by dispute resolution and admin refunds.
 */
export async function createEscrowRefund({
  order,
  escrow,
  dispute = null,
  amount,
  type = 'full',
  reason,
  actor,
  session = null,
}) {
  const value = roundMoney(amount);
  if (!(value > 0)) {
    throw new AppError('Refund amount must be positive', 400, { code: 'INVALID_REFUND_AMOUNT' });
  }

  const wallet = await walletService.getOrCreateSellerWallet(
    order.seller,
    order.sellerUser,
    session,
  );

  await walletService.refundFromEscrowPending({
    wallet,
    amount: value,
    context: {
      order: order._id,
      payment: order.payment,
      escrow: escrow._id,
      dispute: dispute?._id || null,
      buyer: order.buyer,
      currency: order.currency,
    },
    session,
    createdBy: actor?.id || null,
  });

  const refundType = type === 'partial' ? REFUND_TYPE.PARTIAL : REFUND_TYPE.ESCROW;

  const refund = await refundRepository.createRefund(
    {
      refundNumber: generateRefundNumber(),
      order: order._id,
      payment: order.payment,
      escrow: escrow._id,
      dispute: dispute?._id || null,
      buyer: order.buyer,
      seller: order.seller,
      type: refundType,
      amount: value,
      currency: order.currency,
      status: REFUND_STATUS.COMPLETED,
      reason,
      createdBy: actor?.id || null,
      completedAt: new Date(),
    },
    session,
  );

  if (type === 'full' || value >= escrow.amount) {
    await escrowService.markEscrowRefunded(escrow._id, session);
    order.status = ORDER_STATUS.REFUNDED;
    order.refund = refund._id;
    if (session) await order.save({ session });
    else await order.save();

    const payment = await paymentRepository.findPaymentByOrder(order._id, { session });
    if (payment) {
      payment.status = PAYMENT_STATUS.REFUNDED;
      if (session) await payment.save({ session });
      else await payment.save();
    }
  } else {
    // Partial: reduce escrow remaining tracked amounts
    escrow.amount = roundMoney(escrow.amount - value);
    escrow.commissionAmount = roundMoney((escrow.amount * escrow.commissionPercent) / 100);
    escrow.sellerAmount = roundMoney(escrow.amount - escrow.commissionAmount);
    if (session) await escrow.save({ session });
    else await escrow.save();
    order.refund = refund._id;
    if (session) await order.save({ session });
    else await order.save();
  }

  await logActivity({
    userId: actor?.id || null,
    action: 'refunds.completed',
    resource: 'Refund',
    resourceId: refund._id,
    meta: { amount: value, type: refundType, orderId: order._id },
    session,
  });

  return refund;
}

/**
 * Admin manual refund API (full/partial/escrow).
 */
export async function createManualRefund(payload, actor) {
  if (!isAdmin(actor)) {
    throw new AppError('Only admins can create refunds', 403, { code: 'FORBIDDEN' });
  }

  return withTransaction(async (session) => {
    const order = await orderRepository.findOrderById(payload.orderId, { session });
    if (!order) {
      throw new AppError('Order not found', 404, { code: 'ORDER_NOT_FOUND' });
    }

    const escrow = await escrowRepository.findEscrowByOrder(order._id, { session });
    if (!escrow) {
      throw new AppError('Escrow not found', 404, { code: 'ESCROW_NOT_FOUND' });
    }

    if ([ESCROW_STATUS.RELEASED, ESCROW_STATUS.REFUNDED].includes(escrow.status)
      && payload.type !== REFUND_TYPE.MANUAL) {
      throw new AppError('Escrow is closed; use ledger adjustment for post-release refunds', 400, {
        code: 'ESCROW_CLOSED',
      });
    }

    const amount = payload.amount != null ? roundMoney(payload.amount) : escrow.amount;
    const type = amount < escrow.amount ? 'partial' : 'full';

    if (escrow.status === ESCROW_STATUS.RELEASED) {
      // Post-release manual refund: debit seller available if possible
      const wallet = await walletService.getOrCreateSellerWallet(
        order.seller,
        order.sellerUser,
        session,
      );
      if (wallet.availableBalance < amount) {
        throw new AppError('Seller available balance insufficient for post-release refund', 400, {
          code: 'INSUFFICIENT_BALANCE',
        });
      }

      await walletService.adminAdjustWallet({
        sellerId: order.seller,
        amount,
        direction: 'debit',
        reason: payload.reason || 'Manual post-release refund',
        actor,
        session,
      });

      const refund = await refundRepository.createRefund(
        {
          refundNumber: generateRefundNumber(),
          order: order._id,
          payment: order.payment,
          escrow: escrow._id,
          buyer: order.buyer,
          seller: order.seller,
          type: REFUND_TYPE.MANUAL,
          amount,
          currency: order.currency,
          status: REFUND_STATUS.COMPLETED,
          reason: payload.reason || 'Manual refund',
          adminNote: payload.adminNote || null,
          createdBy: actor.id,
          completedAt: new Date(),
        },
        session,
      );

      order.status = type === 'full' ? ORDER_STATUS.REFUNDED : order.status;
      order.refund = refund._id;
      if (session) await order.save({ session });
      else await order.save();

      return refund.toObject();
    }

    const refund = await createEscrowRefund({
      order,
      escrow,
      amount,
      type,
      reason: payload.reason || 'Manual escrow refund',
      actor,
      session,
    });

    return refund.toObject();
  });
}

export async function listRefunds(query = {}, actor) {
  if (!isAdmin(actor) && !actor?.roles?.includes(USER_ROLES.SUPPORT)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  const pagination = parsePagination(query);
  const filter = {};
  if (query.orderId) filter.order = query.orderId;
  if (query.status) filter.status = query.status;
  const { items, total } = await refundRepository.listRefunds(filter, pagination);
  return { items, meta: buildPaginationMeta({ ...pagination, total }) };
}

export async function getRefund(id, actor) {
  const refund = await refundRepository.findRefundById(id, { lean: true });
  if (!refund) {
    throw new AppError('Refund not found', 404, { code: 'REFUND_NOT_FOUND' });
  }
  if (!isAdmin(actor) && !actor?.roles?.includes(USER_ROLES.SUPPORT)) {
    if (String(refund.buyer) !== String(actor.id)) {
      throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
    }
  }
  return refund;
}

export default {
  createEscrowRefund,
  createManualRefund,
  listRefunds,
  getRefund,
};
