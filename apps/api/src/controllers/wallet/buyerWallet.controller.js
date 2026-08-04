import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as buyerWalletService from '../../services/buyerWallet.service.js';

export const getWallet = asyncHandler(async (req, res) => {
  const data = await buyerWalletService.getMyWallet(req.user);
  return sendSuccess(res, { message: 'Buyer wallet', data });
});

export const getHistory = asyncHandler(async (req, res) => {
  const result = await buyerWalletService.listHistory(req.user, req.query);
  return sendSuccess(res, {
    message: 'Wallet history',
    data: result.items,
    meta: result.meta,
  });
});

export const deposit = asyncHandler(async (req, res) => {
  const data = await buyerWalletService.createDepositOrTopup(req.body, req.user, 'deposit');
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Deposit invoice created',
    data,
  });
});

export const topup = asyncHandler(async (req, res) => {
  const data = await buyerWalletService.createDepositOrTopup(req.body, req.user, 'topup');
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Top-up invoice created',
    data,
  });
});

export const listDeposits = asyncHandler(async (req, res) => {
  const result = await buyerWalletService.listMyDeposits(req.user, req.query);
  return sendSuccess(res, {
    message: 'Wallet deposits',
    data: result.items,
    meta: result.meta,
  });
});

export const refreshDeposit = asyncHandler(async (req, res) => {
  const data = await buyerWalletService.refreshMyDeposit(req.user, req.params.depositId);
  return sendSuccess(res, { message: 'Deposit refreshed', data });
});

export const adminGetBuyerWallet = asyncHandler(async (req, res) => {
  const data = await buyerWalletService.adminGetBuyerWallet(req.params.buyerId);
  return sendSuccess(res, { message: 'Buyer wallet', data });
});

export const adminAdjust = asyncHandler(async (req, res) => {
  const data = await buyerWalletService.adminAdjustBuyerWallet(
    { ...req.body, buyerId: req.params.buyerId || req.body.buyerId },
    req.user,
  );
  return sendSuccess(res, { message: 'Buyer wallet adjusted', data });
});

export const adminFreeze = asyncHandler(async (req, res) => {
  const data = await buyerWalletService.freezeBuyerWallet(
    req.params.buyerId,
    req.body?.reason,
    req.user,
  );
  return sendSuccess(res, { message: 'Buyer wallet frozen', data });
});

export const adminUnfreeze = asyncHandler(async (req, res) => {
  const data = await buyerWalletService.unfreezeBuyerWallet(req.params.buyerId, req.user);
  return sendSuccess(res, { message: 'Buyer wallet unfrozen', data });
});

export const adminListTransactions = asyncHandler(async (req, res) => {
  const result = await buyerWalletService.adminListTransactions(req.query);
  return sendSuccess(res, {
    message: 'Buyer wallet transactions',
    data: result.items,
    meta: result.meta,
  });
});

export const adminExportCsv = asyncHandler(async (req, res) => {
  const csv = await buyerWalletService.exportTransactionsCsv(req.query);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="buyer-wallet-transactions.csv"');
  return res.status(200).send(csv);
});

export default {
  getWallet,
  getHistory,
  deposit,
  topup,
  listDeposits,
  refreshDeposit,
  adminGetBuyerWallet,
  adminAdjust,
  adminFreeze,
  adminUnfreeze,
  adminListTransactions,
  adminExportCsv,
};
