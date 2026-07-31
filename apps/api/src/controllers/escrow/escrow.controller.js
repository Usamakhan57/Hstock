import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as escrowService from '../../services/escrow.service.js';
import { SellerProfile } from '../../models/index.js';
import { USER_ROLES } from '../../constants/roles.js';

export const listEscrows = asyncHandler(async (req, res) => {
  const isAdmin = req.user.roles?.some((r) => [
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.SUPPORT,
  ].includes(r));

  let sellerId = null;
  if (!isAdmin) {
    const seller = await SellerProfile.findOne({ user: req.user.id }).lean();
    sellerId = seller?._id || null;
  }

  const result = await escrowService.listEscrows(req.query, {
    admin: isAdmin,
    sellerId,
  });
  return sendSuccess(res, {
    message: 'Escrows',
    data: result.items,
    meta: result.meta,
  });
});

export const getEscrow = asyncHandler(async (req, res) => {
  const data = await escrowService.getEscrow(req.params.id);
  return sendSuccess(res, { message: 'Escrow', data });
});

export const releaseEscrow = asyncHandler(async (req, res) => {
  const data = await escrowService.releaseEscrow(req.params.id, {
    reason: req.body?.reason || 'admin_release',
    actor: req.user,
    force: true,
  });
  return sendSuccess(res, { message: 'Escrow released', data });
});

export default {
  listEscrows,
  getEscrow,
  releaseEscrow,
};
