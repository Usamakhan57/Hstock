import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as walletService from '../../services/wallet.service.js';
import * as ledgerService from '../../services/ledger.service.js';

export const getMyWallet = asyncHandler(async (req, res) => {
  const data = await walletService.getWalletForSellerUser(req.user.id);
  return sendSuccess(res, { message: 'Wallet', data });
});

export const getSellerWallet = asyncHandler(async (req, res) => {
  const data = await walletService.getWalletBySellerId(req.params.sellerId);
  return sendSuccess(res, { message: 'Wallet', data });
});

export const listMyTransactions = asyncHandler(async (req, res) => {
  const result = await walletService.listWalletTransactions(req.user.id, req.query);
  return sendSuccess(res, {
    message: 'Wallet transactions',
    data: result.items,
    meta: result.meta,
  });
});

export const listLedger = asyncHandler(async (req, res) => {
  const isAdmin = req.user.roles?.some((r) => ['admin', 'super_admin', 'support'].includes(r));
  const query = { ...req.query };
  if (!isAdmin) {
    const { SellerProfile } = await import('../../models/index.js');
    const seller = await SellerProfile.findOne({ user: req.user.id }).lean();
    query.sellerId = seller?._id;
  }
  const result = await ledgerService.listLedger(query);
  return sendSuccess(res, {
    message: 'Ledger',
    data: result.items,
    meta: result.meta,
  });
});

export const adjustWallet = asyncHandler(async (req, res) => {
  const data = await walletService.adminAdjustWallet({
    sellerId: req.body.sellerId,
    amount: req.body.amount,
    direction: req.body.direction,
    reason: req.body.reason,
    actor: req.user,
  });
  return sendSuccess(res, { message: 'Wallet adjusted', data });
});

export default {
  getMyWallet,
  getSellerWallet,
  listMyTransactions,
  listLedger,
  adjustWallet,
};
