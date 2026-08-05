import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '../utils/AppError.js';
import { SellerProfile } from '../models/index.js';
import * as publicSellersService from '../services/publicSellers.service.js';

export const list = asyncHandler(async (req, res) => {
  const result = await publicSellersService.listPublicSellers(req.query);
  return sendSuccess(res, {
    message: 'Sellers',
    data: result.items,
    meta: result.meta,
  });
});

export const getBySlug = asyncHandler(async (req, res) => {
  const data = await publicSellersService.getPublicSellerBySlug(req.params.slug);
  return sendSuccess(res, { message: 'Seller store', data });
});

/**
 * Authenticated seller — same Total Sales aggregation as public profile / featured stores.
 */
export const myStatistics = asyncHandler(async (req, res) => {
  const profile = await SellerProfile.findOne({ user: req.user.id }).select('_id').lean();
  if (!profile) {
    throw new AppError('Seller profile not found', 404, { code: 'SELLER_NOT_FOUND' });
  }
  const data = await publicSellersService.getMySellerStatistics(profile._id);
  return sendSuccess(res, { message: 'Seller statistics', data });
});

export default {
  list,
  getBySlug,
  myStatistics,
};
