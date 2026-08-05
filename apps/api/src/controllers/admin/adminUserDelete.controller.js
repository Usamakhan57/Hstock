import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as userService from '../../services/user.service.js';

export const adminDeleteUser = asyncHandler(async (req, res) => {
  const data = await userService.adminSoftDeleteUser(
    req.params.id,
    { confirm: req.body?.confirm || req.query?.confirm },
    req.user,
  );
  return sendSuccess(res, {
    message: 'User deleted',
    data,
  });
});

export default {
  adminDeleteUser,
};
