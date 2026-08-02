import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as paymentService from '../../services/payment.service.js';
import * as cryptomusService from '../../services/cryptomus.service.js';

export const listPayments = asyncHandler(async (req, res) => {
  const result = await paymentService.listPayments(req.query, req.user);
  return sendSuccess(res, {
    message: 'Payments',
    data: result.items,
    meta: result.meta,
  });
});

export const getPayment = asyncHandler(async (req, res) => {
  const data = await paymentService.getPayment(req.params.id, req.user);
  return sendSuccess(res, { message: 'Payment', data });
});

export const syncPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.syncPaymentFromCryptomus(req.params.id, req.user);
  return sendSuccess(res, {
    message: 'Payment synced',
    data: result.payment,
  });
});

export const cryptomusWebhook = asyncHandler(async (req, res) => {
  const data = await paymentService.handleCryptomusWebhook(req.body, { ip: req.ip });
  return sendSuccess(res, { message: 'Webhook processed', data });
});

export const listCryptomusServices = asyncHandler(async (_req, res) => {
  const data = await cryptomusService.listPaymentServices();
  return sendSuccess(res, { message: 'Cryptomus payment services', data });
});

export const listCheckoutAssets = asyncHandler(async (_req, res) => {
  const data = await cryptomusService.listCheckoutAssets();
  return sendSuccess(res, {
    message: 'Cryptomus checkout assets',
    data: data.assets,
    meta: {
      source: data.source,
      mode: data.mode,
      count: data.assets?.length || 0,
    },
  });
});

export const sandboxConfirm = asyncHandler(async (req, res) => {
  const result = await paymentService.sandboxConfirmPayment(req.params.uuid);
  return sendSuccess(res, {
    message: 'Sandbox payment confirmed',
    data: result.payment,
  });
});

export default {
  listPayments,
  getPayment,
  syncPayment,
  cryptomusWebhook,
  listCryptomusServices,
  listCheckoutAssets,
  sandboxConfirm,
};
