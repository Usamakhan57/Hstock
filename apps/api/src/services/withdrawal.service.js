import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../utils/transaction.js';
import { roundMoney } from '../helpers/money.helper.js';
import { generateWithdrawalNumber } from '../helpers/id.helper.js';
import {
  isSupportedCoin,
  isSupportedNetwork,
  isCoinNetworkCompatible,
  validateWalletAddress,
} from '../helpers/wallet.helper.js';
import { WITHDRAWAL_STATUS } from '../constants/statuses.js';
import { SellerProfile } from '../models/index.js';
import * as withdrawalRepository from '../repositories/withdrawal.repository.js';
import * as walletService from './wallet.service.js';
import { getPlatformConfig } from './config.service.js';
import { logActivity } from './activity.service.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { USER_ROLES } from '../constants/roles.js';

function isAdmin(actor) {
  return actor?.roles?.some((r) => [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(r));
}

export async function requestWithdrawal(payload, actor, requestMeta = {}) {
  if (!actor?.roles?.includes(USER_ROLES.SELLER) && !isAdmin(actor)) {
    throw new AppError('Only sellers can request withdrawals', 403, { code: 'FORBIDDEN' });
  }

  const seller = await SellerProfile.findOne({ user: actor.id });
  if (!seller) {
    throw new AppError('Seller profile not found', 404, { code: 'SELLER_NOT_FOUND' });
  }
  if (seller.status !== 'approved') {
    throw new AppError('Seller account is not approved for withdrawals', 403, {
      code: 'SELLER_NOT_APPROVED',
    });
  }

  const coin = String(payload.coin || '').toUpperCase();
  const network = String(payload.network || '').toUpperCase();
  const walletAddress = String(payload.walletAddress || '').trim();
  const amount = roundMoney(payload.amount);

  if (!isSupportedCoin(coin)) {
    throw new AppError('Unsupported coin', 400, { code: 'UNSUPPORTED_COIN' });
  }
  if (!isSupportedNetwork(network)) {
    throw new AppError('Unsupported network', 400, { code: 'UNSUPPORTED_NETWORK' });
  }
  if (!isCoinNetworkCompatible(coin, network)) {
    throw new AppError('Coin and network are not compatible', 400, {
      code: 'COIN_NETWORK_MISMATCH',
    });
  }

  const addressCheck = validateWalletAddress(network, walletAddress);
  if (!addressCheck.valid) {
    throw new AppError(addressCheck.reason || 'Invalid wallet address', 400, {
      code: 'INVALID_WALLET_ADDRESS',
    });
  }

  const platform = await getPlatformConfig();
  const minAmount = Number(platform?.minWithdrawalAmount ?? 10);
  const maxAmount = Number(platform?.maxWithdrawalAmount ?? 100000);

  if (!(amount >= minAmount)) {
    throw new AppError(`Minimum withdrawal amount is ${minAmount}`, 400, {
      code: 'WITHDRAWAL_BELOW_MIN',
      details: { minAmount },
    });
  }
  if (amount > maxAmount) {
    throw new AppError(`Maximum withdrawal amount is ${maxAmount}`, 400, {
      code: 'WITHDRAWAL_ABOVE_MAX',
      details: { maxAmount },
    });
  }

  const pendingCount = await withdrawalRepository.countPendingBySeller(seller._id);
  if (pendingCount >= 5) {
    throw new AppError('Too many pending withdrawal requests', 400, {
      code: 'WITHDRAWAL_PENDING_LIMIT',
    });
  }

  return withTransaction(async (session) => {
    const wallet = await walletService.getOrCreateSellerWallet(seller._id, seller.user, session);

    await walletService.reserveForWithdrawal({
      wallet,
      amount,
      context: { currency: wallet.currency },
      session,
      createdBy: actor.id,
    });

    const withdrawal = await withdrawalRepository.createWithdrawal(
      {
        requestNumber: generateWithdrawalNumber(),
        seller: seller._id,
        sellerUser: seller.user,
        wallet: wallet._id,
        amount,
        currency: wallet.currency,
        coin,
        network,
        walletAddress,
        status: WITHDRAWAL_STATUS.PENDING,
      },
      session,
    );

    await logActivity({
      userId: actor.id,
      action: 'withdrawals.requested',
      resource: 'Withdrawal',
      resourceId: withdrawal._id,
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      meta: { amount, coin, network },
      session,
    });

    return withdrawal.toObject();
  });
}

export async function listWithdrawals(query = {}, actor) {
  const pagination = parsePagination(query);
  const filter = {};

  if (isAdmin(actor) || actor?.roles?.includes(USER_ROLES.SUPPORT)) {
    if (query.sellerId) filter.seller = query.sellerId;
    if (query.status) filter.status = query.status;
  } else {
    const seller = await SellerProfile.findOne({ user: actor.id }).lean();
    if (!seller) {
      throw new AppError('Seller profile not found', 404, { code: 'SELLER_NOT_FOUND' });
    }
    filter.seller = seller._id;
    if (query.status) filter.status = query.status;
  }

  const { items, total } = await withdrawalRepository.listWithdrawals(filter, pagination);
  return { items, meta: buildPaginationMeta({ ...pagination, total }) };
}

export async function getWithdrawal(id, actor) {
  const withdrawal = await withdrawalRepository.findWithdrawalById(id, { lean: true });
  if (!withdrawal) {
    throw new AppError('Withdrawal not found', 404, { code: 'WITHDRAWAL_NOT_FOUND' });
  }

  if (!isAdmin(actor) && !actor?.roles?.includes(USER_ROLES.SUPPORT)) {
    if (String(withdrawal.sellerUser) !== String(actor.id)) {
      throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
    }
  }
  return withdrawal;
}

export async function approveWithdrawal(id, actor, { note = null } = {}) {
  if (!isAdmin(actor)) {
    throw new AppError('Only admins can approve withdrawals', 403, { code: 'FORBIDDEN' });
  }

  return withTransaction(async (session) => {
    const withdrawal = await withdrawalRepository.findWithdrawalById(id, { session });
    if (!withdrawal) {
      throw new AppError('Withdrawal not found', 404, { code: 'WITHDRAWAL_NOT_FOUND' });
    }
    if (withdrawal.status !== WITHDRAWAL_STATUS.PENDING) {
      throw new AppError('Only pending withdrawals can be approved', 400, {
        code: 'WITHDRAWAL_INVALID_STATUS',
      });
    }

    withdrawal.status = WITHDRAWAL_STATUS.APPROVED;
    withdrawal.approvedAt = new Date();
    withdrawal.reviewedAt = new Date();
    withdrawal.reviewedBy = actor.id;
    withdrawal.adminNote = note;
    if (session) await withdrawal.save({ session });
    else await withdrawal.save();

    await logActivity({
      userId: actor.id,
      action: 'withdrawals.approved',
      resource: 'Withdrawal',
      resourceId: withdrawal._id,
      session,
    });

    return withdrawal.toObject();
  });
}

/**
 * Mark withdrawal as Paid after manual payout. NO automatic Cryptomus payout.
 */
export async function markWithdrawalPaid(id, actor, {
  payoutReference = null,
  payoutTxid = null,
  note = null,
} = {}) {
  if (!isAdmin(actor)) {
    throw new AppError('Only admins can mark withdrawals paid', 403, { code: 'FORBIDDEN' });
  }

  return withTransaction(async (session) => {
    const withdrawal = await withdrawalRepository.findWithdrawalById(id, { session });
    if (!withdrawal) {
      throw new AppError('Withdrawal not found', 404, { code: 'WITHDRAWAL_NOT_FOUND' });
    }
    if (![WITHDRAWAL_STATUS.PENDING, WITHDRAWAL_STATUS.APPROVED].includes(withdrawal.status)) {
      throw new AppError('Withdrawal cannot be marked paid in current status', 400, {
        code: 'WITHDRAWAL_INVALID_STATUS',
      });
    }

    const wallet = await walletService.getOrCreateSellerWallet(
      withdrawal.seller,
      withdrawal.sellerUser,
      session,
    );

    await walletService.finalizeWithdrawalPayment({
      wallet,
      amount: withdrawal.amount,
      context: { withdrawal: withdrawal._id, currency: withdrawal.currency },
      session,
      createdBy: actor.id,
    });

    const now = new Date();
    if (withdrawal.status === WITHDRAWAL_STATUS.PENDING) {
      withdrawal.approvedAt = now;
    }
    withdrawal.status = WITHDRAWAL_STATUS.PAID;
    withdrawal.paidAt = now;
    withdrawal.reviewedAt = now;
    withdrawal.reviewedBy = actor.id;
    withdrawal.payoutReference = payoutReference;
    withdrawal.payoutTxid = payoutTxid;
    if (note) withdrawal.adminNote = note;
    if (session) await withdrawal.save({ session });
    else await withdrawal.save();

    await logActivity({
      userId: actor.id,
      action: 'withdrawals.paid',
      resource: 'Withdrawal',
      resourceId: withdrawal._id,
      meta: { payoutReference, payoutTxid },
      session,
    });

    return withdrawal.toObject();
  });
}

export async function rejectWithdrawal(id, actor, { reason = 'Rejected by admin' } = {}) {
  if (!isAdmin(actor)) {
    throw new AppError('Only admins can reject withdrawals', 403, { code: 'FORBIDDEN' });
  }

  return withTransaction(async (session) => {
    const withdrawal = await withdrawalRepository.findWithdrawalById(id, { session });
    if (!withdrawal) {
      throw new AppError('Withdrawal not found', 404, { code: 'WITHDRAWAL_NOT_FOUND' });
    }
    if (![WITHDRAWAL_STATUS.PENDING, WITHDRAWAL_STATUS.APPROVED].includes(withdrawal.status)) {
      throw new AppError('Withdrawal cannot be rejected in current status', 400, {
        code: 'WITHDRAWAL_INVALID_STATUS',
      });
    }

    const wallet = await walletService.getOrCreateSellerWallet(
      withdrawal.seller,
      withdrawal.sellerUser,
      session,
    );

    await walletService.releaseWithdrawalReservation({
      wallet,
      amount: withdrawal.amount,
      context: { withdrawal: withdrawal._id, currency: withdrawal.currency },
      session,
      createdBy: actor.id,
    });

    withdrawal.status = WITHDRAWAL_STATUS.REJECTED;
    withdrawal.rejectedAt = new Date();
    withdrawal.reviewedAt = new Date();
    withdrawal.reviewedBy = actor.id;
    withdrawal.rejectionReason = reason;
    if (session) await withdrawal.save({ session });
    else await withdrawal.save();

    await logActivity({
      userId: actor.id,
      action: 'withdrawals.rejected',
      resource: 'Withdrawal',
      resourceId: withdrawal._id,
      meta: { reason },
      session,
    });

    return withdrawal.toObject();
  });
}

export async function cancelWithdrawal(id, actor) {
  return withTransaction(async (session) => {
    const withdrawal = await withdrawalRepository.findWithdrawalById(id, { session });
    if (!withdrawal) {
      throw new AppError('Withdrawal not found', 404, { code: 'WITHDRAWAL_NOT_FOUND' });
    }

    const owner = String(withdrawal.sellerUser) === String(actor.id);
    if (!owner && !isAdmin(actor)) {
      throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
    }

    if (withdrawal.status !== WITHDRAWAL_STATUS.PENDING) {
      throw new AppError('Only pending withdrawals can be cancelled', 400, {
        code: 'WITHDRAWAL_INVALID_STATUS',
      });
    }

    const wallet = await walletService.getOrCreateSellerWallet(
      withdrawal.seller,
      withdrawal.sellerUser,
      session,
    );

    await walletService.releaseWithdrawalReservation({
      wallet,
      amount: withdrawal.amount,
      context: { withdrawal: withdrawal._id, currency: withdrawal.currency },
      session,
      createdBy: actor.id,
    });

    withdrawal.status = WITHDRAWAL_STATUS.CANCELLED;
    withdrawal.cancelledAt = new Date();
    if (session) await withdrawal.save({ session });
    else await withdrawal.save();

    await logActivity({
      userId: actor.id,
      action: 'withdrawals.cancelled',
      resource: 'Withdrawal',
      resourceId: withdrawal._id,
      session,
    });

    return withdrawal.toObject();
  });
}

export default {
  requestWithdrawal,
  listWithdrawals,
  getWithdrawal,
  approveWithdrawal,
  markWithdrawalPaid,
  rejectWithdrawal,
  cancelWithdrawal,
};
