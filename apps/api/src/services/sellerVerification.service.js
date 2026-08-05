import { AppError } from '../utils/AppError.js';
import { roundMoney } from '../helpers/money.helper.js';
import { withTransaction } from '../utils/transaction.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { SellerProfile } from '../models/index.js';
import { SellerStatusEnum, VerificationStatusEnum } from '../constants/enums.js';
import {
  SELLER_VERIFICATION_DEFAULTS,
  VERIFICATION_SOURCE,
} from '../constants/sellerVerification.js';
import * as configService from './config.service.js';
import * as walletService from './wallet.service.js';
import { generatePaymentOrderId } from '../helpers/id.helper.js';
import { logActivity } from './activity.service.js';
import { logger } from '../config/logger.js';

export async function getVerificationSettings() {
  const platform = await configService.getPlatformConfig();
  return {
    enabled: platform.sellerVerificationEnabled !== false,
    feeUsd: roundMoney(
      platform.sellerVerificationFeeUsd ?? SELLER_VERIFICATION_DEFAULTS.feeUsd,
    ),
    allowManual: platform.allowManualSellerVerification !== false,
  };
}

function actorId(actor) {
  return actor?.id || actor?._id || null;
}

async function resolveSellerForActor(actor) {
  const seller = await SellerProfile.findOne({ user: actorId(actor) });
  if (!seller) {
    throw new AppError('Seller profile not found', 404, { code: 'SELLER_NOT_FOUND' });
  }
  return seller;
}

export function serializeVerificationSeller(doc) {
  if (!doc) return null;
  const raw = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  const verified = raw.verified === true;
  return {
    ...raw,
    id: String(raw._id || raw.id),
    sellerVerified: verified,
    verified,
    verifiedAt: raw.verifiedAt || null,
    verificationFeePaid: raw.verificationFeePaid ?? null,
    verificationSource: raw.verificationSource || null,
    verifiedBy: raw.verifiedBy || null,
  };
}

export async function getMyVerificationStatus(actor) {
  const seller = await resolveSellerForActor(actor);
  const settings = await getVerificationSettings();
  const wallet = await walletService.getWalletForSellerUser(actorId(actor));
  const fee = settings.feeUsd;
  const verified = seller.verified === true;

  return {
    settings,
    wallet: {
      availableBalance: wallet.availableBalance,
      frozen: false,
    },
    canAfford: !verified && roundMoney(wallet.availableBalance) + 1e-9 >= fee,
    verified,
    sellerVerified: verified,
    verifiedAt: seller.verifiedAt || null,
    verificationFeePaid: seller.verificationFeePaid ?? null,
    verificationSource: seller.verificationSource || null,
    storeName: seller.storeName,
    status: seller.status,
  };
}

/**
 * One-time $10 (configurable) seller-wallet purchase for permanent Verified badge.
 */
export async function purchaseSellerVerification(actor) {
  const settings = await getVerificationSettings();
  if (!settings.enabled) {
    throw new AppError('Seller verification is currently disabled', 400, {
      code: 'VERIFICATION_DISABLED',
    });
  }

  const seller = await resolveSellerForActor(actor);
  if (seller.status !== SellerStatusEnum.Approved) {
    throw new AppError('Only approved sellers can purchase verification', 400, {
      code: 'SELLER_NOT_APPROVED',
    });
  }

  if (seller.verified === true) {
    return {
      seller: serializeVerificationSeller(seller),
      reused: true,
      wallet: await walletService.getWalletForSellerUser(actorId(actor)),
    };
  }

  const amount = settings.feeUsd;
  const preview = await walletService.getWalletForSellerUser(actorId(actor));
  if (roundMoney(preview.availableBalance) + 1e-9 < amount) {
    throw new AppError('Insufficient balance. Please top up your seller wallet.', 400, {
      code: 'INSUFFICIENT_WALLET_BALANCE',
      details: {
        availableBalance: preview.availableBalance,
        required: amount,
        walletPath: '/seller/earnings',
      },
    });
  }

  const result = await withTransaction(async (session) => {
    const paymentId = generatePaymentOrderId(`verify_${seller._id}`);
    const debit = await walletService.debitForSellerVerification({
      sellerId: seller._id,
      sellerUserId: seller.user,
      amount,
      transferId: paymentId,
      description: 'Permanent Verified Seller badge',
      actor,
      session,
    });

    seller.verified = true;
    seller.verificationStatus = VerificationStatusEnum.Verified;
    seller.verifiedAt = new Date();
    seller.verificationFeePaid = amount;
    seller.verificationSource = VERIFICATION_SOURCE.WALLET;
    seller.verifiedBy = null;
    await seller.save({ session });

    return { seller, wallet: debit.wallet };
  });

  await logActivity({
    userId: actorId(actor),
    action: 'sellers.verification.purchase',
    resource: 'SellerProfile',
    resourceId: seller._id,
    meta: { amount, source: VERIFICATION_SOURCE.WALLET },
  });

  logger.info('Seller verification purchased', {
    sellerId: String(seller._id),
    amount,
  });

  return {
    seller: serializeVerificationSeller(result.seller),
    reused: false,
    wallet: await walletService.serializeWallet(
      result.wallet,
      result.seller.toObject ? result.seller.toObject() : result.seller,
    ),
  };
}

export async function listVerifiedSellers(query = {}) {
  const pagination = parsePagination(query, { page: 1, limit: 50, maxLimit: 100 });
  const filter = {};
  if (query.verified === 'false') {
    filter.verified = { $ne: true };
  } else if (query.verified !== 'all') {
    filter.verified = true;
  }
  if (query.search) {
    const re = new RegExp(String(query.search).trim(), 'i');
    filter.$or = [{ storeName: re }, { email: re }, { slug: re }, { ownerName: re }];
  }

  const [items, total] = await Promise.all([
    SellerProfile.find(filter)
      .populate('user', 'name email')
      .populate('verifiedBy', 'name email')
      .sort({ verifiedAt: -1, updatedAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    SellerProfile.countDocuments(filter),
  ]);

  return {
    items: items.map(serializeVerificationSeller),
    meta: buildPaginationMeta({ ...pagination, total }),
  };
}

export async function adminSetVerification(sellerId, { verify, refund = false }, actor) {
  const settings = await getVerificationSettings();
  const seller = await SellerProfile.findById(sellerId);
  if (!seller) {
    throw new AppError('Seller not found', 404, { code: 'SELLER_NOT_FOUND' });
  }

  if (verify) {
    if (!settings.allowManual && seller.verified !== true) {
      throw new AppError('Manual verification is disabled', 400, {
        code: 'MANUAL_VERIFICATION_DISABLED',
      });
    }
    seller.verified = true;
    seller.verificationStatus = VerificationStatusEnum.Verified;
    seller.verifiedAt = seller.verifiedAt || new Date();
    seller.verificationSource = seller.verificationSource || VERIFICATION_SOURCE.ADMIN;
    seller.verifiedBy = actorId(actor);
    if (seller.verificationFeePaid == null) {
      seller.verificationFeePaid = 0;
    }
  } else {
    const previousFee = seller.verificationFeePaid;
    const previousSource = seller.verificationSource;
    seller.verified = false;
    seller.verificationStatus = VerificationStatusEnum.Unverified;
    seller.verifiedAt = null;
    seller.verificationSource = null;
    seller.verifiedBy = null;
    seller.verificationFeePaid = null;

    if (refund && previousSource === VERIFICATION_SOURCE.WALLET && previousFee > 0) {
      await walletService.adminAdjustWallet({
        sellerId: seller._id,
        amount: previousFee,
        direction: 'credit',
        reason: 'Verification fee refund',
        actor,
      });
    }
  }

  await seller.save();
  await logActivity({
    userId: actorId(actor),
    action: verify ? 'sellers.verification.admin_grant' : 'sellers.verification.admin_revoke',
    resource: 'SellerProfile',
    resourceId: seller._id,
    meta: { verify, refund: !!refund },
  });

  await seller.populate([
    { path: 'user', select: 'name email' },
    { path: 'verifiedBy', select: 'name email' },
  ]);

  return serializeVerificationSeller(seller);
}

export default {
  getVerificationSettings,
  getMyVerificationStatus,
  purchaseSellerVerification,
  listVerifiedSellers,
  adminSetVerification,
  serializeVerificationSeller,
};
