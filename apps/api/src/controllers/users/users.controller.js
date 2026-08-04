import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as userService from '../../services/user.service.js';

export const getMe = asyncHandler(async (req, res) => {
  const result = await userService.getUserById(req.user.id);
  return sendSuccess(res, { message: 'Current user', data: result });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateCurrentUser(req.user.id, req.body);
  return sendSuccess(res, { message: 'Profile updated', data: { user } });
});

export const updateBuyerProfile = asyncHandler(async (req, res) => {
  const profile = await userService.updateBuyerProfile(req.user.id, req.body);
  return sendSuccess(res, { message: 'Buyer profile updated', data: { profile } });
});

export const updateSellerProfile = asyncHandler(async (req, res) => {
  const profile = await userService.updateSellerProfile(req.user.id, req.body);
  return sendSuccess(res, { message: 'Seller profile updated', data: { profile } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await userService.changePassword(req.user.id, req.body);
  return sendSuccess(res, { message: 'Password changed', data: result });
});

export const myActivity = asyncHandler(async (req, res) => {
  const result = await userService.getMyActivity(req.user.id, req.query);
  return sendSuccess(res, {
    message: 'Activity logs',
    data: result.items,
    meta: result.meta,
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const result = await userService.listUsers(req.query);
  return sendSuccess(res, {
    message: 'Users',
    data: result.items,
    meta: result.meta,
  });
});

export const adminUpdateUser = asyncHandler(async (req, res) => {
  const user = await userService.adminUpdateUser(req.params.id, req.body, req.user.id);
  return sendSuccess(res, { message: 'User updated', data: { user } });
});

export const adminInviteUser = asyncHandler(async (req, res) => {
  const data = await userService.adminInviteUser(req.body, req.user.id);
  return sendSuccess(res, { message: 'User invited', data });
});

export const adminListSellers = asyncHandler(async (req, res) => {
  const result = await userService.adminListSellers(req.query);
  return sendSuccess(res, {
    message: 'Sellers',
    data: result.items,
    meta: result.meta,
  });
});

export const adminGetSeller = asyncHandler(async (req, res) => {
  const seller = await userService.adminGetSeller(req.params.id);
  return sendSuccess(res, { message: 'Seller', data: { seller } });
});

export const adminUpdateSeller = asyncHandler(async (req, res) => {
  const seller = await userService.adminUpdateSellerStatus(
    req.params.id,
    req.body,
    req.user.id,
  );
  return sendSuccess(res, { message: 'Seller updated', data: { seller } });
});

export default {
  getMe,
  updateMe,
  updateBuyerProfile,
  updateSellerProfile,
  changePassword,
  myActivity,
  listUsers,
  adminUpdateUser,
  adminInviteUser,
  adminListSellers,
  adminGetSeller,
  adminUpdateSeller,
};
