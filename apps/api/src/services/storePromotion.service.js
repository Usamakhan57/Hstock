import { AppError } from '../utils/AppError.js';
import { roundMoney } from '../helpers/money.helper.js';
import { withTransaction } from '../utils/transaction.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import {
  STORE_PROMOTION_STATUS,
  STORE_PROMOTION_DEFAULTS,
} from '../constants/storePromotion.js';
import { SellerProfile, StorePromotion } from '../models/index.js';
import * as configService from './config.service.js';
import * as walletService from './wallet.service.js';
import { generatePaymentOrderId } from '../helpers/id.helper.js';
import { logger } from '../config/logger.js';

function isPromotionLive(promo, now = new Date()) {
  return (
    promo
    && promo.status === STORE_PROMOTION_STATUS.ACTIVE
    && new Date(promo.expiresAt).getTime() > now.getTime()
  );
}

export async function getPromotionSettings() {
  const platform = await configService.getPlatformConfig();
  return {
    enabled: platform.storePromotionEnabled !== false,
    priceUsd: roundMoney(
      platform.storePromotionPriceUsd ?? STORE_PROMOTION_DEFAULTS.priceUsd,
    ),
    durationHours: Number(
      platform.storePromotionDurationHours ?? STORE_PROMOTION_DEFAULTS.durationHours,
    ),
  };
}

export function serializePromotion(doc) {
  if (!doc) return null;
  const raw = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const now = Date.now();
  const expiresAt = raw.expiresAt ? new Date(raw.expiresAt).getTime() : 0;
  const active = raw.status === STORE_PROMOTION_STATUS.ACTIVE && expiresAt > now;
  return {
    ...raw,
    id: raw._id,
    sellerId: raw.sellerId,
    isActive: active,
    remainingMs: active ? Math.max(0, expiresAt - now) : 0,
  };
}

async function resolveSellerForActor(actor) {
  const seller = await SellerProfile.findOne({ user: actor.id || actor._id });
  if (!seller) {
    throw new AppError('Seller profile not found', 404, { code: 'SELLER_NOT_FOUND' });
  }
  if (seller.status !== 'approved') {
    throw new AppError('Only approved sellers can promote their store', 400, {
      code: 'SELLER_NOT_APPROVED',
    });
  }
  return seller;
}

export async function getMyPromotionStatus(actor) {
  const seller = await resolveSellerForActor(actor);
  const settings = await getPromotionSettings();
  const wallet = await walletService.getWalletForSellerUser(actor.id || actor._id);

  const active = await StorePromotion.findOne({
    sellerId: seller._id,
    status: STORE_PROMOTION_STATUS.ACTIVE,
    expiresAt: { $gt: new Date() },
  }).sort({ expiresAt: -1 }).lean();

  // Heal denormalized flags if stale
  if (!active && seller.storePromotionActive) {
    await SellerProfile.updateOne(
      { _id: seller._id },
      {
        $set: {
          storePromotionActive: false,
          storePromotedUntil: null,
          activeStorePromotion: null,
        },
      },
    );
  }

  return {
    settings,
    wallet: {
      availableBalance: wallet.availableBalance,
      frozen: false,
    },
    canAfford: roundMoney(wallet.availableBalance) + 1e-9 >= settings.priceUsd,
    activePromotion: active ? serializePromotion(active) : null,
    storePromotionActive: Boolean(active),
    storePromotedUntil: active?.expiresAt || null,
  };
}

/**
 * Purchase a store promotion — seller wallet only.
 */
export async function purchaseStorePromotion(actor) {
  const settings = await getPromotionSettings();
  if (!settings.enabled) {
    throw new AppError('Store promotion is currently disabled', 400, {
      code: 'PROMOTION_DISABLED',
    });
  }

  const seller = await resolveSellerForActor(actor);
  const amount = settings.priceUsd;
  const durationHours = settings.durationHours;

  // Idempotent: if already actively promoted, return current promo
  const existing = await StorePromotion.findOne({
    sellerId: seller._id,
    status: STORE_PROMOTION_STATUS.ACTIVE,
    expiresAt: { $gt: new Date() },
  }).lean();
  if (existing) {
    return {
      promotion: serializePromotion(existing),
      reused: true,
      wallet: await walletService.getWalletForSellerUser(actor.id || actor._id),
    };
  }

  const preview = await walletService.getWalletForSellerUser(actor.id || actor._id);
  if (roundMoney(preview.availableBalance) + 1e-9 < amount) {
    throw new AppError('Insufficient Wallet Balance.', 400, {
      code: 'INSUFFICIENT_WALLET_BALANCE',
      details: {
        availableBalance: preview.availableBalance,
        required: amount,
        walletPath: '/seller/earnings',
      },
    });
  }

  const result = await withTransaction(async (session) => {
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000);
    const paymentId = generatePaymentOrderId(`promo_${seller._id}`);

    const [promotion] = await StorePromotion.create(
      [
        {
          sellerId: seller._id,
          sellerUser: seller.user,
          status: STORE_PROMOTION_STATUS.ACTIVE,
          amount,
          durationHours,
          startsAt,
          expiresAt,
          paymentId,
          analytics: { views: 0, clicks: 0, ordersGenerated: 0 },
        },
      ],
      { session },
    );

    const debit = await walletService.debitForStorePromotion({
      sellerId: seller._id,
      sellerUserId: seller.user,
      amount,
      promotionId: promotion._id,
      transferId: paymentId,
      description: `Store promotion (${durationHours}h)`,
      actor,
      session,
    });

    promotion.wallet = debit.wallet._id;
    await promotion.save({ session });

    await SellerProfile.updateOne(
      { _id: seller._id },
      {
        $set: {
          storePromotionActive: true,
          storePromotedUntil: expiresAt,
          activeStorePromotion: promotion._id,
        },
      },
      { session },
    );

    return { promotion, wallet: debit.wallet };
  });

  logger.info('Store promotion purchased', {
    sellerId: String(seller._id),
    promotionId: String(result.promotion._id),
    amount,
  });

  return {
    promotion: serializePromotion(result.promotion),
    reused: false,
    wallet: await walletService.serializeWallet(
      result.wallet,
      seller.toObject ? seller.toObject() : seller,
    ),
  };
}

export async function listPromotions(query = {}) {
  const pagination = parsePagination(query, { page: 1, limit: 50, maxLimit: 100 });
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.sellerId) filter.sellerId = query.sellerId;
  if (query.active === 'true') {
    filter.status = STORE_PROMOTION_STATUS.ACTIVE;
    filter.expiresAt = { $gt: new Date() };
  }

  const [items, total] = await Promise.all([
    StorePromotion.find(filter)
      .populate('sellerId', 'storeName slug email status storePromotionActive storePromotedUntil')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    StorePromotion.countDocuments(filter),
  ]);

  return {
    items: items.map(serializePromotion),
    meta: buildPaginationMeta({ ...pagination, total }),
  };
}

export async function getPromotionAnalytics() {
  const now = new Date();
  const [purchases, revenueAgg, activeCount, expiredCount, analyticsAgg] = await Promise.all([
    StorePromotion.countDocuments({}),
    StorePromotion.aggregate([
      { $match: { status: { $ne: STORE_PROMOTION_STATUS.CANCELLED } } },
      { $group: { _id: null, revenue: { $sum: '$amount' } } },
    ]),
    StorePromotion.countDocuments({
      status: STORE_PROMOTION_STATUS.ACTIVE,
      expiresAt: { $gt: now },
    }),
    StorePromotion.countDocuments({
      $or: [
        { status: STORE_PROMOTION_STATUS.EXPIRED },
        { status: STORE_PROMOTION_STATUS.ACTIVE, expiresAt: { $lte: now } },
      ],
    }),
    StorePromotion.aggregate([
      {
        $group: {
          _id: null,
          views: { $sum: '$analytics.views' },
          clicks: { $sum: '$analytics.clicks' },
          ordersGenerated: { $sum: '$analytics.ordersGenerated' },
        },
      },
    ]),
  ]);

  const analytics = analyticsAgg[0] || {};
  return {
    purchases,
    revenue: roundMoney(revenueAgg[0]?.revenue || 0),
    active: activeCount,
    expired: expiredCount,
    views: analytics.views || 0,
    clicks: analytics.clicks || 0,
    ordersGenerated: analytics.ordersGenerated || 0,
  };
}

export async function extendPromotion(promotionId, { hours, actor } = {}) {
  const promo = await StorePromotion.findById(promotionId);
  if (!promo) {
    throw new AppError('Promotion not found', 404, { code: 'PROMOTION_NOT_FOUND' });
  }
  const addHours = Number(hours);
  if (!(addHours > 0)) {
    throw new AppError('hours must be positive', 400, { code: 'INVALID_HOURS' });
  }

  const base = isPromotionLive(promo) ? new Date(promo.expiresAt) : new Date();
  const expiresAt = new Date(base.getTime() + addHours * 60 * 60 * 1000);
  promo.status = STORE_PROMOTION_STATUS.ACTIVE;
  promo.expiresAt = expiresAt;
  if (!promo.startsAt) promo.startsAt = new Date();
  await promo.save();

  await SellerProfile.updateOne(
    { _id: promo.sellerId },
    {
      $set: {
        storePromotionActive: true,
        storePromotedUntil: expiresAt,
        activeStorePromotion: promo._id,
      },
    },
  );

  logger.info('Store promotion extended', {
    promotionId: String(promo._id),
    hours: addHours,
    by: actor?.id,
  });

  return serializePromotion(promo);
}

export async function cancelPromotion(promotionId, { reason, actor } = {}) {
  const promo = await StorePromotion.findById(promotionId);
  if (!promo) {
    throw new AppError('Promotion not found', 404, { code: 'PROMOTION_NOT_FOUND' });
  }
  if (promo.status === STORE_PROMOTION_STATUS.CANCELLED) {
    return serializePromotion(promo);
  }

  promo.status = STORE_PROMOTION_STATUS.CANCELLED;
  promo.cancelledAt = new Date();
  promo.cancelledBy = actor?.id || null;
  promo.cancelReason = reason || null;
  await promo.save();

  await clearSellerPromotionFlags(promo.sellerId, promo._id);

  return serializePromotion(promo);
}

async function clearSellerPromotionFlags(sellerId, promotionId = null) {
  const filter = { _id: sellerId };
  if (promotionId) {
    filter.$or = [
      { activeStorePromotion: promotionId },
      { activeStorePromotion: null },
      { activeStorePromotion: { $exists: false } },
    ];
  }

  // Only clear if no other live promotion remains
  const other = await StorePromotion.findOne({
    sellerId,
    status: STORE_PROMOTION_STATUS.ACTIVE,
    expiresAt: { $gt: new Date() },
    ...(promotionId ? { _id: { $ne: promotionId } } : {}),
  }).lean();

  if (other) {
    await SellerProfile.updateOne(
      { _id: sellerId },
      {
        $set: {
          storePromotionActive: true,
          storePromotedUntil: other.expiresAt,
          activeStorePromotion: other._id,
        },
      },
    );
    return;
  }

  await SellerProfile.updateOne(
    filter,
    {
      $set: {
        storePromotionActive: false,
        storePromotedUntil: null,
        activeStorePromotion: null,
      },
    },
  );
}

/**
 * Expire due promotions — called by cron job.
 */
export async function expireDuePromotions({ limit = 100 } = {}) {
  const now = new Date();
  const due = await StorePromotion.find({
    status: STORE_PROMOTION_STATUS.ACTIVE,
    expiresAt: { $lte: now },
  }).limit(limit);

  let succeeded = 0;
  const errors = [];

  for (const promo of due) {
    try {
      promo.status = STORE_PROMOTION_STATUS.EXPIRED;
      await promo.save();
      await clearSellerPromotionFlags(promo.sellerId, promo._id);
      succeeded += 1;
    } catch (error) {
      errors.push({ id: String(promo._id), error: error.message });
    }
  }

  // Also heal sellers with stale denorm flags
  const staleSellers = await SellerProfile.find({
    storePromotionActive: true,
    $or: [
      { storePromotedUntil: { $lte: now } },
      { storePromotedUntil: null },
    ],
  }).limit(limit).select('_id');

  for (const s of staleSellers) {
    await clearSellerPromotionFlags(s._id);
  }

  return {
    processed: due.length,
    succeeded,
    failed: errors.length,
    errors,
    staleCleared: staleSellers.length,
  };
}

export async function trackPromotionEvent(sellerId, event) {
  if (!sellerId || !['views', 'clicks', 'ordersGenerated'].includes(event)) return;
  await StorePromotion.updateOne(
    {
      sellerId,
      status: STORE_PROMOTION_STATUS.ACTIVE,
      expiresAt: { $gt: new Date() },
    },
    { $inc: { [`analytics.${event}`]: 1 } },
  );
}

export async function getActivePromotedSellerIds() {
  const now = new Date();
  const sellers = await SellerProfile.find({
    storePromotionActive: true,
    storePromotedUntil: { $gt: now },
    status: 'approved',
  }).select('_id').lean();
  return sellers.map((s) => String(s._id));
}

export function isSellerPromoted(seller, now = new Date()) {
  if (!seller) return false;
  if (seller.storePromotionActive && seller.storePromotedUntil) {
    return new Date(seller.storePromotedUntil).getTime() > now.getTime();
  }
  return false;
}

export default {
  getPromotionSettings,
  getMyPromotionStatus,
  purchaseStorePromotion,
  listPromotions,
  getPromotionAnalytics,
  extendPromotion,
  cancelPromotion,
  expireDuePromotions,
  trackPromotionEvent,
  getActivePromotedSellerIds,
  isSellerPromoted,
  serializePromotion,
};
