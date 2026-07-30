import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as configService from '../../services/config.service.js';

export const getConfigs = asyncHandler(async (_req, res) => {
  const data = await configService.getAllConfigs();
  return sendSuccess(res, { message: 'Platform configuration', data });
});

export const getSystemConfig = asyncHandler(async (_req, res) => {
  const data = await configService.getSystemConfig();
  return sendSuccess(res, { message: 'System configuration', data });
});

export const getPlatformConfig = asyncHandler(async (_req, res) => {
  const data = await configService.getPlatformConfig();
  return sendSuccess(res, { message: 'Platform configuration', data });
});

export const getCommissionConfig = asyncHandler(async (_req, res) => {
  const data = await configService.getCommissionConfig();
  return sendSuccess(res, { message: 'Commission configuration', data });
});

export const updateSystemConfig = asyncHandler(async (req, res) => {
  const data = await configService.updateSystemConfig(req.body, req.user.id);
  return sendSuccess(res, { message: 'System configuration updated', data });
});

export const updatePlatformConfig = asyncHandler(async (req, res) => {
  const data = await configService.updatePlatformConfig(req.body, req.user.id);
  return sendSuccess(res, { message: 'Platform configuration updated', data });
});

export const updateCommissionConfig = asyncHandler(async (req, res) => {
  const data = await configService.updateCommissionConfig(req.body, req.user.id);
  return sendSuccess(res, { message: 'Commission configuration updated', data });
});

export const getSellerRegistrationFee = asyncHandler(async (_req, res) => {
  const data = await configService.getSellerRegistrationFee();
  return sendSuccess(res, { message: 'Seller registration fee', data });
});

export default {
  getConfigs,
  getSystemConfig,
  getPlatformConfig,
  getCommissionConfig,
  updateSystemConfig,
  updatePlatformConfig,
  updateCommissionConfig,
  getSellerRegistrationFee,
};
