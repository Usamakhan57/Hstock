/**
 * Soft-delete seller accounts while preserving financial / audit history.
 * Does not mutate wallet core, escrow, orders, ledger, or dispute resolution logic.
 */
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../utils/transaction.js';
import {
  User,
  Product,
  ProductImage,
  Order,
  Escrow,
  Withdrawal,
  Dispute,
  DisputeReplacement,
  StorePromotion,
  Notification,
  RefreshToken,
  PasswordResetToken,
  EmailVerificationToken,
} from '../models/index.js';
import {
  UserStatusEnum,
  SellerStatusEnum,
  VerificationStatusEnum,
} from '../constants/enums.js';
import {
  ORDER_STATUS,
  ESCROW_STATUS,
  WITHDRAWAL_STATUS,
  DISPUTE_STATUS,
} from '../constants/statuses.js';
import { REPLACEMENT_STATUS } from '../constants/disputeFinal.js';
import { STORE_PROMOTION_STATUS } from '../constants/storePromotion.js';
import {
  PRODUCT_STATUS,
  APPROVAL_STATUS,
  PRODUCT_VISIBILITY,
} from '../constants/productTypes.js';
import { USER_ROLES } from '../constants/roles.js';
import { findSellerProfileByIdOrUserId, serializeSeller } from './user.service.js';
import { logActivity } from './activity.service.js';
import { logger } from '../config/logger.js';

const DELETED_STORE_NAME = 'Deleted Seller';

/** Human-readable labels for API / admin UI. */
export const SELLER_DELETE_BLOCKER_LABELS = Object.freeze({
  open_orders: 'Open Orders',
  active_escrow: 'Active Escrow',
  pending_withdraw: 'Pending Withdrawal',
  active_dispute: 'Active Dispute',
  pending_replacement: 'Pending Replacement',
  store_promotion: 'Active Store Promotion',
});

function actorId(actor) {
  return actor?.id || actor?._id || null;
}

function toBlocker(key, count) {
  return {
    blockedBy: SELLER_DELETE_BLOCKER_LABELS[key] || key,
    count,
    key,
  };
}

/**
 * Counts only truly active marketplace operations.
 *
 * Escrow: locked | disputed only.
 * Pending escrow rows on cancelled/expired/unpaid checkouts do NOT block —
 * those are unpaid placeholders, not held funds.
 *
 * Terminal statuses (completed, cancelled, expired, released, refunded,
 * closed, resolved) never block deletion.
 */
export async function getSellerDeletionBlockers(sellerId) {
  const sellerObjectId = new mongoose.Types.ObjectId(String(sellerId));
  const openOrderStatuses = [
    ORDER_STATUS.PENDING_PAYMENT,
    ORDER_STATUS.PAYMENT_PROCESSING,
    ORDER_STATUS.PAID,
    ORDER_STATUS.ESCROW,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.DISPUTED,
  ];
  // Intentionally excludes ESCROW_STATUS.PENDING — stale pending escrows on
  // cancelled/expired unpaid orders must not block seller deletion.
  const activeEscrowStatuses = [
    ESCROW_STATUS.LOCKED,
    ESCROW_STATUS.DISPUTED,
  ];
  const openWithdrawalStatuses = [
    WITHDRAWAL_STATUS.PENDING,
    WITHDRAWAL_STATUS.APPROVED,
  ];
  const openDisputeStatuses = [
    DISPUTE_STATUS.OPEN,
    DISPUTE_STATUS.UNDER_REVIEW,
    DISPUTE_STATUS.WAITING_FOR_BUYER_CONFIRMATION,
  ];
  if (DISPUTE_STATUS.MAXIMUM_REPLACEMENTS_REACHED) {
    openDisputeStatuses.push(DISPUTE_STATUS.MAXIMUM_REPLACEMENTS_REACHED);
  }

  const disputeIds = await Dispute.find({ seller: sellerObjectId }).distinct('_id');

  const [
    openOrders,
    activeEscrows,
    pendingWithdraw,
    activeDisputes,
    pendingReplacements,
    activePromotions,
  ] = await Promise.all([
    Order.countDocuments({ seller: sellerObjectId, status: { $in: openOrderStatuses } }),
    Escrow.countDocuments({ seller: sellerObjectId, status: { $in: activeEscrowStatuses } }),
    Withdrawal.countDocuments({
      seller: sellerObjectId,
      status: { $in: openWithdrawalStatuses },
    }),
    Dispute.countDocuments({
      seller: sellerObjectId,
      status: { $in: openDisputeStatuses },
    }),
    disputeIds.length
      ? DisputeReplacement.countDocuments({
        dispute: { $in: disputeIds },
        status: REPLACEMENT_STATUS.PENDING,
      })
      : 0,
    StorePromotion.countDocuments({
      sellerId: sellerObjectId,
      status: STORE_PROMOTION_STATUS.ACTIVE,
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null },
      ],
    }),
  ]);

  const counts = {
    openOrders,
    activeEscrows,
    pendingWithdraw,
    activeDisputes,
    pendingReplacements,
    activePromotions,
  };

  const blockers = [];
  if (openOrders) blockers.push(toBlocker('open_orders', openOrders));
  if (activeEscrows) blockers.push(toBlocker('active_escrow', activeEscrows));
  if (pendingWithdraw) blockers.push(toBlocker('pending_withdraw', pendingWithdraw));
  if (activeDisputes) blockers.push(toBlocker('active_dispute', activeDisputes));
  if (pendingReplacements) blockers.push(toBlocker('pending_replacement', pendingReplacements));
  if (activePromotions) blockers.push(toBlocker('store_promotion', activePromotions));

  const primary = blockers[0] || null;

  return {
    blocked: blockers.length > 0,
    blockedBy: primary?.blockedBy || null,
    count: primary?.count || 0,
    blockers,
    counts,
  };
}

/**
 * Soft-delete a seller. Requires confirm === 'DELETE'.
 */
export async function adminSoftDeleteSeller(sellerOrUserId, { confirm } = {}, actor) {
  if (String(confirm || '').trim() !== 'DELETE') {
    throw new AppError('Type DELETE to confirm seller deletion', 400, {
      code: 'DELETE_CONFIRMATION_REQUIRED',
    });
  }

  const seller = await findSellerProfileByIdOrUserId(sellerOrUserId);
  if (!seller) {
    throw new AppError('Seller not found', 404, { code: 'SELLER_NOT_FOUND' });
  }
  if (seller.deleted === true) {
    return {
      seller: serializeSeller(seller),
      alreadyDeleted: true,
    };
  }

  const blockers = await getSellerDeletionBlockers(seller._id);
  if (blockers.blocked) {
    const primary = blockers.blockers[0];
    const summary = blockers.blockers
      .map((b) => `${b.blockedBy} (${b.count})`)
      .join(', ');

    logger.warn('Seller delete blocked by active marketplace operations', {
      sellerId: String(seller._id),
      blockedBy: primary.blockedBy,
      count: primary.count,
      blockers: blockers.blockers,
      counts: blockers.counts,
    });

    throw new AppError(
      `Seller cannot be deleted: ${summary}.`,
      409,
      {
        code: 'SELLER_DELETE_BLOCKED',
        details: {
          blockedBy: primary.blockedBy,
          count: primary.count,
          blockers: blockers.blockers,
          counts: blockers.counts,
        },
      },
    );
  }

  const adminId = actorId(actor);
  const now = new Date();
  const previousStoreName = seller.storeName;

  await withTransaction(async (session) => {
    const productIds = await Product.find({ seller: seller._id })
      .session(session)
      .distinct('_id');

    if (productIds.length) {
      await Product.updateMany(
        { _id: { $in: productIds } },
        {
          $set: {
            deletedAt: now,
            status: PRODUCT_STATUS.ARCHIVED,
            visibility: PRODUCT_VISIBILITY.PRIVATE,
            approvalStatus: APPROVAL_STATUS.PENDING,
          },
        },
        { session },
      );
      await ProductImage.deleteMany(
        { product: { $in: productIds } },
        { session },
      );
    }

    await StorePromotion.updateMany(
      {
        sellerId: seller._id,
        status: STORE_PROMOTION_STATUS.ACTIVE,
      },
      {
        $set: {
          status: STORE_PROMOTION_STATUS.CANCELLED,
          cancelledAt: now,
          cancelReason: 'Seller account deleted',
        },
      },
      { session },
    );

    seller.storeNameBeforeDelete = previousStoreName;
    seller.storeName = DELETED_STORE_NAME;
    seller.deleted = true;
    seller.deletedAt = now;
    seller.deletedBy = adminId;
    seller.status = SellerStatusEnum.Suspended;
    seller.verified = false;
    seller.verificationStatus = VerificationStatusEnum.Unverified;
    seller.verifiedAt = null;
    seller.verificationFeePaid = null;
    seller.verificationSource = null;
    seller.verifiedBy = null;
    seller.storePromotionActive = false;
    seller.storePromotedUntil = null;
    seller.activeStorePromotion = null;
    seller.logo = null;
    seller.banner = null;
    seller.avatar = null;
    seller.bio = '';
    await seller.save({ session });

    if (seller.user) {
      const user = await User.findById(seller.user).session(session);
      if (user) {
        user.status = UserStatusEnum.Deleted;
        user.roles = (user.roles || []).filter((role) => role !== USER_ROLES.SELLER);
        if (!user.roles.length) user.roles = [USER_ROLES.BUYER];
        await user.save({ session });

        await Promise.all([
          RefreshToken.deleteMany({ user: user._id }).session(session),
          PasswordResetToken.deleteMany({ user: user._id }).session(session),
          EmailVerificationToken.deleteMany({ user: user._id }).session(session),
          Notification.deleteMany({ user: user._id }).session(session),
        ]);
      }
    }
  });

  await logActivity({
    userId: adminId,
    action: 'sellers.delete',
    resource: 'SellerProfile',
    resourceId: seller._id,
    meta: {
      previousStoreName,
      softDelete: true,
    },
  });

  logger.info('Seller soft-deleted', {
    sellerId: String(seller._id),
    by: String(adminId),
  });

  await seller.populate([
    { path: 'user', select: 'name email roles status' },
    { path: 'deletedBy', select: 'name email' },
  ]);

  return {
    seller: serializeSeller(seller),
    alreadyDeleted: false,
  };
}

export default {
  getSellerDeletionBlockers,
  adminSoftDeleteSeller,
  DELETED_STORE_NAME,
  SELLER_DELETE_BLOCKER_LABELS,
};
