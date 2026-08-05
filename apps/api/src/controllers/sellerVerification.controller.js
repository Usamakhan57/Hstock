import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as sellerVerificationService from '../services/sellerVerification.service.js';

export const getMyStatus = asyncHandler(async (req, res) => {
  const data = await sellerVerificationService.getMyVerificationStatus(req.user);
  return sendSuccess(res, { message: 'Seller verification status', data });
});

export const purchase = asyncHandler(async (req, res) => {
  const data = await sellerVerificationService.purchaseSellerVerification(req.user);
  return sendSuccess(res, {
    message: data.reused ? 'Already verified' : 'Seller verification activated',
    data,
    statusCode: data.reused ? 200 : 201,
  });
});

export const adminList = asyncHandler(async (req, res) => {
  const result = await sellerVerificationService.listVerifiedSellers(req.query);
  return sendSuccess(res, {
    message: 'Seller verifications',
    data: result.items,
    meta: result.meta,
  });
});

export const adminVerify = asyncHandler(async (req, res) => {
  const data = await sellerVerificationService.adminSetVerification(
    req.params.id,
    { verify: true },
    req.user,
  );
  return sendSuccess(res, { message: 'Seller verified', data });
});

export const adminUnverify = asyncHandler(async (req, res) => {
  const data = await sellerVerificationService.adminSetVerification(
    req.params.id,
    { verify: false, refund: !!req.body?.refund },
    req.user,
  );
  return sendSuccess(res, { message: 'Seller verification removed', data });
});

export default {
  getMyStatus,
  purchase,
  adminList,
  adminVerify,
  adminUnverify,
};
