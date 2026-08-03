import { AppError } from '../utils/AppError.js';
import { roundMoney } from '../helpers/money.helper.js';
import {
  applyWalletCredit,
  applyPendingCredit,
  applyPendingDebit,
  reserveWithdrawal,
  releaseWithdrawalReserve,
  finalizeWithdrawalDebit,
  computeWithdrawable,
} from '../helpers/wallet.helper.js';
import { LEDGER_ACCOUNT, LEDGER_DIRECTION, LEDGER_ENTRY_TYPE } from '../constants/ledger.js';
import * as walletRepository from '../repositories/wallet.repository.js';
import * as ledgerService from './ledger.service.js';
import { SellerProfile } from '../models/index.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import * as ledgerRepository from '../repositories/ledger.repository.js';

export async function getOrCreateSellerWallet(sellerId, sellerUserId, session = null) {
  return walletRepository.getOrCreateWallet({ sellerId, sellerUserId }, session);
}

export async function getWalletForSellerUser(userId) {
  const seller = await SellerProfile.findOne({ user: userId }).lean();
  if (!seller) {
    throw new AppError('Seller profile not found', 404, { code: 'SELLER_NOT_FOUND' });
  }
  const wallet = await getOrCreateSellerWallet(seller._id, userId);
  return serializeWallet(wallet, seller);
}

export async function getWalletBySellerId(sellerId) {
  const seller = await SellerProfile.findById(sellerId).lean();
  if (!seller) {
    throw new AppError('Seller profile not found', 404, { code: 'SELLER_NOT_FOUND' });
  }
  const wallet = await getOrCreateSellerWallet(seller._id, seller.user);
  return serializeWallet(wallet, seller);
}

export function serializeWallet(wallet, seller = null) {
  const doc = typeof wallet.toObject === 'function' ? wallet.toObject() : wallet;
  return {
    ...doc,
    withdrawableBalance: computeWithdrawable(doc.availableBalance, doc.reservedBalance),
    seller: seller
      ? {
          id: seller._id,
          storeName: seller.storeName,
          slug: seller.slug,
          status: seller.status,
        }
      : undefined,
  };
}

/**
 * Record buyer payment into escrow (double-entry) and credit seller pending balance.
 */
export async function recordBuyerPaymentIntoEscrow({
  wallet,
  amount,
  context,
  session,
  createdBy = null,
  source = 'cryptomus',
}) {
  const value = roundMoney(amount);
  const paymentId = context?.payment ? String(context.payment) : null;
  const fundTransferId = paymentId ? `escrow_fund_${paymentId}` : null;
  const pendingTransferId = paymentId ? `escrow_pending_alloc_${paymentId}` : null;

  if (fundTransferId) {
    const existing = await ledgerRepository.findEntriesByTransferId(fundTransferId, { session });
    if (existing?.length) {
      return wallet;
    }
  }

  const fundingLine = source === 'wallet'
    ? {
      direction: LEDGER_DIRECTION.DEBIT,
      account: LEDGER_ACCOUNT.BUYER_AVAILABLE,
      amount: value,
      entryType: LEDGER_ENTRY_TYPE.BUYER_SPEND,
      description: 'Buyer wallet balance applied to purchase',
    }
    : {
      direction: LEDGER_DIRECTION.DEBIT,
      account: LEDGER_ACCOUNT.EXTERNAL_GATEWAY,
      amount: value,
      entryType: LEDGER_ENTRY_TYPE.BUYER_PAYMENT,
      description: 'Buyer crypto payment received via Cryptomus',
    };

  await ledgerService.recordTransfer({
    session,
    createdBy,
    transferId: fundTransferId || undefined,
    context: {
      ...context,
      seller: wallet.seller,
      sellerUser: wallet.sellerUser,
      wallet: wallet._id,
      buyerWallet: context?.buyerWallet || null,
    },
    lines: [
      fundingLine,
      {
        direction: LEDGER_DIRECTION.CREDIT,
        account: LEDGER_ACCOUNT.ESCROW,
        amount: value,
        entryType: LEDGER_ENTRY_TYPE.ESCROW_CREDIT,
        description: 'Funds credited to escrow',
      },
    ],
  });

  applyPendingCredit(wallet, value);
  await walletRepository.saveWallet(wallet, session);

  await ledgerService.recordTransfer({
    session,
    createdBy,
    transferId: pendingTransferId || undefined,
    context: {
      ...context,
      seller: wallet.seller,
      sellerUser: wallet.sellerUser,
      wallet: wallet._id,
    },
    lines: [
      {
        direction: LEDGER_DIRECTION.DEBIT,
        account: LEDGER_ACCOUNT.ESCROW,
        amount: value,
        entryType: LEDGER_ENTRY_TYPE.SELLER_PENDING_CREDIT,
        description: 'Allocate escrow to seller pending (memo)',
        meta: { memo: true },
      },
      {
        direction: LEDGER_DIRECTION.CREDIT,
        account: LEDGER_ACCOUNT.SELLER_PENDING,
        amount: value,
        entryType: LEDGER_ENTRY_TYPE.SELLER_PENDING_CREDIT,
        balanceAfter: wallet.pendingBalance,
        description: 'Seller pending balance credit',
        meta: { memo: true },
      },
    ],
  });

  return wallet;
}

/**
 * Release escrow: pending → available, deduct commission.
 * Balanced: Dr SELLER_PENDING gross; Cr COMMISSION + SELLER_AVAILABLE.
 */
export async function releaseEscrowToSeller({
  wallet,
  grossAmount,
  commissionAmount,
  sellerAmount,
  context,
  session,
  createdBy = null,
}) {
  const gross = roundMoney(grossAmount);
  const commission = roundMoney(commissionAmount);
  const sellerNet = roundMoney(sellerAmount);

  if (roundMoney(commission + sellerNet) !== gross) {
    throw new AppError('Escrow release amounts do not balance', 500, {
      code: 'ESCROW_SPLIT_INVALID',
      details: { gross, commission, sellerNet },
    });
  }

  applyPendingDebit(wallet, gross);
  applyWalletCredit(wallet, sellerNet);
  wallet.totalCommissionPaid = roundMoney(wallet.totalCommissionPaid + commission);
  await walletRepository.saveWallet(wallet, session);

  const commonContext = {
    ...context,
    seller: wallet.seller,
    sellerUser: wallet.sellerUser,
    wallet: wallet._id,
  };

  const creditLines = [];
  if (commission > 0) {
    creditLines.push({
      direction: LEDGER_DIRECTION.CREDIT,
      account: LEDGER_ACCOUNT.COMMISSION_REVENUE,
      amount: commission,
      entryType: LEDGER_ENTRY_TYPE.COMMISSION_CREDIT,
      description: 'Platform commission revenue',
    });
  }
  if (sellerNet > 0) {
    creditLines.push({
      direction: LEDGER_DIRECTION.CREDIT,
      account: LEDGER_ACCOUNT.SELLER_AVAILABLE,
      amount: sellerNet,
      entryType: LEDGER_ENTRY_TYPE.SELLER_WALLET_CREDIT,
      balanceAfter: wallet.availableBalance,
      description: 'Seller available wallet credit',
    });
  }

  await ledgerService.recordTransfer({
    session,
    createdBy,
    context: commonContext,
    lines: [
      {
        direction: LEDGER_DIRECTION.DEBIT,
        account: LEDGER_ACCOUNT.SELLER_PENDING,
        amount: gross,
        entryType: LEDGER_ENTRY_TYPE.ESCROW_DEBIT,
        balanceAfter: wallet.pendingBalance,
        description: 'Escrow auto/manual release',
      },
      ...creditLines,
    ],
  });

  return wallet;
}

/**
 * Refund from escrow (full or partial) while funds are still locked/disputed.
 */
export async function refundFromEscrowPending({
  wallet,
  amount,
  context,
  session,
  createdBy = null,
}) {
  const value = roundMoney(amount);
  applyPendingDebit(wallet, value);
  await walletRepository.saveWallet(wallet, session);

  await ledgerService.recordTransfer({
    session,
    createdBy,
    context: {
      ...context,
      seller: wallet.seller,
      sellerUser: wallet.sellerUser,
      wallet: wallet._id,
    },
    lines: [
      {
        direction: LEDGER_DIRECTION.DEBIT,
        account: LEDGER_ACCOUNT.SELLER_PENDING,
        amount: value,
        entryType: LEDGER_ENTRY_TYPE.REFUND_DEBIT,
        balanceAfter: wallet.pendingBalance,
        description: 'Escrow refund — clear seller pending',
      },
      {
        direction: LEDGER_DIRECTION.CREDIT,
        account: LEDGER_ACCOUNT.REFUND_PAYABLE,
        amount: value,
        entryType: LEDGER_ENTRY_TYPE.REFUND_CREDIT,
        description: 'Refund payable to buyer',
      },
    ],
  });

  // Settle refund into buyer wallet available balance (not external gateway payout).
  await ledgerService.recordTransfer({
    session,
    createdBy,
    context: {
      ...context,
      seller: wallet.seller,
      sellerUser: wallet.sellerUser,
      wallet: wallet._id,
      buyer: context?.buyer || null,
    },
    lines: [
      {
        direction: LEDGER_DIRECTION.DEBIT,
        account: LEDGER_ACCOUNT.REFUND_PAYABLE,
        amount: value,
        entryType: LEDGER_ENTRY_TYPE.REFUND_DEBIT,
        description: 'Refund payable cleared to buyer wallet',
      },
      {
        direction: LEDGER_DIRECTION.CREDIT,
        account: LEDGER_ACCOUNT.BUYER_AVAILABLE,
        amount: value,
        entryType: LEDGER_ENTRY_TYPE.BUYER_REFUND_CREDIT,
        description: 'Buyer refund credited to wallet',
      },
    ],
  });

  return wallet;
}

export async function reserveForWithdrawal({
  wallet,
  amount,
  context,
  session,
  createdBy = null,
}) {
  try {
    reserveWithdrawal(wallet, amount);
  } catch {
    throw new AppError('Insufficient withdrawable balance', 400, {
      code: 'INSUFFICIENT_BALANCE',
    });
  }
  await walletRepository.saveWallet(wallet, session);

  await ledgerService.recordTransfer({
    session,
    createdBy,
    context: {
      ...context,
      seller: wallet.seller,
      sellerUser: wallet.sellerUser,
      wallet: wallet._id,
    },
    lines: [
      {
        direction: LEDGER_DIRECTION.DEBIT,
        account: LEDGER_ACCOUNT.SELLER_AVAILABLE,
        amount,
        entryType: LEDGER_ENTRY_TYPE.WITHDRAWAL_RESERVE,
        balanceAfter: wallet.availableBalance,
        description: 'Reserve funds for withdrawal request',
      },
      {
        direction: LEDGER_DIRECTION.CREDIT,
        account: LEDGER_ACCOUNT.SELLER_WITHDRAWAL_RESERVE,
        amount,
        entryType: LEDGER_ENTRY_TYPE.WITHDRAWAL_RESERVE,
        balanceAfter: wallet.reservedBalance,
        description: 'Withdrawal reserve credit',
      },
    ],
  });

  return wallet;
}

export async function releaseWithdrawalReservation({
  wallet,
  amount,
  context,
  session,
  createdBy = null,
}) {
  releaseWithdrawalReserve(wallet, amount);
  await walletRepository.saveWallet(wallet, session);

  await ledgerService.recordTransfer({
    session,
    createdBy,
    context: {
      ...context,
      seller: wallet.seller,
      sellerUser: wallet.sellerUser,
      wallet: wallet._id,
    },
    lines: [
      {
        direction: LEDGER_DIRECTION.DEBIT,
        account: LEDGER_ACCOUNT.SELLER_WITHDRAWAL_RESERVE,
        amount,
        entryType: LEDGER_ENTRY_TYPE.WITHDRAWAL_RELEASE,
        balanceAfter: wallet.reservedBalance,
        description: 'Release withdrawal reserve',
      },
      {
        direction: LEDGER_DIRECTION.CREDIT,
        account: LEDGER_ACCOUNT.SELLER_AVAILABLE,
        amount,
        entryType: LEDGER_ENTRY_TYPE.WITHDRAWAL_RELEASE,
        balanceAfter: wallet.availableBalance,
        description: 'Return funds to available balance',
      },
    ],
  });

  return wallet;
}

export async function finalizeWithdrawalPayment({
  wallet,
  amount,
  context,
  session,
  createdBy = null,
}) {
  finalizeWithdrawalDebit(wallet, amount);
  await walletRepository.saveWallet(wallet, session);

  await ledgerService.recordTransfer({
    session,
    createdBy,
    context: {
      ...context,
      seller: wallet.seller,
      sellerUser: wallet.sellerUser,
      wallet: wallet._id,
    },
    lines: [
      {
        direction: LEDGER_DIRECTION.DEBIT,
        account: LEDGER_ACCOUNT.SELLER_WITHDRAWAL_RESERVE,
        amount,
        entryType: LEDGER_ENTRY_TYPE.WITHDRAWAL_DEBIT,
        balanceAfter: wallet.reservedBalance,
        description: 'Withdrawal paid — reserve cleared',
      },
      {
        direction: LEDGER_DIRECTION.CREDIT,
        account: LEDGER_ACCOUNT.EXTERNAL_GATEWAY,
        amount,
        entryType: LEDGER_ENTRY_TYPE.WITHDRAWAL_DEBIT,
        description: 'Manual payout to seller external wallet',
      },
    ],
  });

  return wallet;
}

export async function adminAdjustWallet({
  sellerId,
  amount,
  direction,
  reason,
  actor,
  session = null,
}) {
  const seller = await SellerProfile.findById(sellerId);
  if (!seller) {
    throw new AppError('Seller profile not found', 404, { code: 'SELLER_NOT_FOUND' });
  }

  const value = roundMoney(amount);
  if (!(value > 0)) {
    throw new AppError('Adjustment amount must be positive', 400, { code: 'INVALID_AMOUNT' });
  }

  const run = async (activeSession) => {
    const wallet = await getOrCreateSellerWallet(seller._id, seller.user, activeSession);

    if (direction === 'debit') {
      if (wallet.availableBalance < value) {
        throw new AppError('Insufficient available balance for debit', 400, {
          code: 'INSUFFICIENT_BALANCE',
        });
      }
      wallet.availableBalance = roundMoney(wallet.availableBalance - value);
    } else {
      wallet.availableBalance = roundMoney(wallet.availableBalance + value);
    }
    wallet.withdrawableBalance = computeWithdrawable(
      wallet.availableBalance,
      wallet.reservedBalance,
    );
    wallet.lastTransactionAt = new Date();
    wallet.version = (wallet.version || 0) + 1;
    await walletRepository.saveWallet(wallet, activeSession);

    const lines = direction === 'credit'
      ? [
          {
            direction: LEDGER_DIRECTION.DEBIT,
            account: LEDGER_ACCOUNT.PLATFORM_ADJUSTMENT,
            amount: value,
            entryType: LEDGER_ENTRY_TYPE.ADMIN_ADJUSTMENT,
            description: reason || 'Admin credit adjustment',
          },
          {
            direction: LEDGER_DIRECTION.CREDIT,
            account: LEDGER_ACCOUNT.SELLER_AVAILABLE,
            amount: value,
            entryType: LEDGER_ENTRY_TYPE.ADMIN_ADJUSTMENT,
            balanceAfter: wallet.availableBalance,
            description: reason || 'Admin credit adjustment',
          },
        ]
      : [
          {
            direction: LEDGER_DIRECTION.DEBIT,
            account: LEDGER_ACCOUNT.SELLER_AVAILABLE,
            amount: value,
            entryType: LEDGER_ENTRY_TYPE.ADMIN_ADJUSTMENT,
            balanceAfter: wallet.availableBalance,
            description: reason || 'Admin debit adjustment',
          },
          {
            direction: LEDGER_DIRECTION.CREDIT,
            account: LEDGER_ACCOUNT.PLATFORM_ADJUSTMENT,
            amount: value,
            entryType: LEDGER_ENTRY_TYPE.ADMIN_ADJUSTMENT,
            description: reason || 'Admin debit adjustment',
          },
        ];

    await ledgerService.recordTransfer({
      session: activeSession,
      createdBy: actor?.id || null,
      context: {
        seller: wallet.seller,
        sellerUser: wallet.sellerUser,
        wallet: wallet._id,
      },
      lines,
    });

    return serializeWallet(wallet, seller.toObject ? seller.toObject() : seller);
  };

  if (session) return run(session);
  const { withTransaction } = await import('../utils/transaction.js');
  return withTransaction(run);
}

export async function listWalletTransactions(sellerUserId, query = {}) {
  const seller = await SellerProfile.findOne({ user: sellerUserId }).lean();
  if (!seller) {
    throw new AppError('Seller profile not found', 404, { code: 'SELLER_NOT_FOUND' });
  }
  const pagination = parsePagination(query, { page: 1, limit: 50, maxLimit: 100 });
  const { items, total } = await ledgerRepository.listLedgerEntries(
    { seller: seller._id },
    pagination,
  );
  return {
    items,
    meta: buildPaginationMeta({ ...pagination, total }),
  };
}

export default {
  getOrCreateSellerWallet,
  getWalletForSellerUser,
  getWalletBySellerId,
  serializeWallet,
  recordBuyerPaymentIntoEscrow,
  releaseEscrowToSeller,
  refundFromEscrowPending,
  reserveForWithdrawal,
  releaseWithdrawalReservation,
  finalizeWithdrawalPayment,
  adminAdjustWallet,
  listWalletTransactions,
};
