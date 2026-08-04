import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as storePromotionService from '../services/storePromotion.service.js';

export const getMyStatus = asyncHandler(async (req, res) => {
  const data = await storePromotionService.getMyPromotionStatus(req.user);
  return sendSuccess(res, { message: 'Store promotion status', data });
});

export const purchase = asyncHandler(async (req, res) => {
  const data = await storePromotionService.purchaseStorePromotion(req.user);
  return sendSuccess(res, {
    message: data.reused ? 'Store already promoted' : 'Store promotion activated',
    data,
    statusCode: data.reused ? 200 : 201,
  });
});

export const adminList = asyncHandler(async (req, res) => {
  const result = await storePromotionService.listPromotions(req.query);
  return sendSuccess(res, {
    message: 'Store promotions',
    data: result.items,
    meta: result.meta,
  });
});

export const adminAnalytics = asyncHandler(async (req, res) => {
  const data = await storePromotionService.getPromotionAnalytics();
  return sendSuccess(res, { message: 'Promotion analytics', data });
});

export const adminExtend = asyncHandler(async (req, res) => {
  const data = await storePromotionService.extendPromotion(req.params.id, {
    hours: req.body.hours,
    actor: req.user,
  });
  return sendSuccess(res, { message: 'Promotion extended', data });
});

export const adminCancel = asyncHandler(async (req, res) => {
  const data = await storePromotionService.cancelPromotion(req.params.id, {
    reason: req.body.reason,
    actor: req.user,
  });
  return sendSuccess(res, { message: 'Promotion cancelled', data });
});

export default {
  getMyStatus,
  purchase,
  adminList,
  adminAnalytics,
  adminExtend,
  adminCancel,
};
