import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
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

export default {
  list,
  getBySlug,
};
