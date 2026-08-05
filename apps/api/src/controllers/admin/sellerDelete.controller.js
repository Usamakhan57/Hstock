import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as sellerDeleteService from '../../services/sellerDelete.service.js';

export const adminDeleteSeller = asyncHandler(async (req, res) => {
  const data = await sellerDeleteService.adminSoftDeleteSeller(
    req.params.id,
    { confirm: req.body?.confirm || req.query?.confirm },
    req.user,
  );
  return sendSuccess(res, {
    message: data.alreadyDeleted ? 'Seller already deleted' : 'Seller deleted',
    data,
  });
});

export default {
  adminDeleteSeller,
};
