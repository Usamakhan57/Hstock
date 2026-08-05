import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as sellerDeleteService from '../../services/sellerDelete.service.js';

export const adminDeleteSeller = asyncHandler(async (req, res) => {
  const data = await sellerDeleteService.adminSoftDeleteSeller(
    req.params.id,
    {
      confirm: req.body?.confirm || req.query?.confirm,
      force: req.body?.force ?? req.query?.force,
      acknowledge: req.body?.acknowledge ?? req.query?.acknowledge,
    },
    req.user,
  );
  let message = 'Seller deleted';
  if (data.alreadyDeleted) message = 'Seller already deleted';
  else if (data.forceDeleted) message = 'Seller force-deleted';
  return sendSuccess(res, {
    message,
    data,
  });
});

export default {
  adminDeleteSeller,
};
