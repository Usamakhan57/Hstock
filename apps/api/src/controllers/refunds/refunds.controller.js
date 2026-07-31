import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as refundService from '../../services/refund.service.js';

export const createRefund = asyncHandler(async (req, res) => {
  const data = await refundService.createManualRefund(req.body, req.user);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Refund created',
    data,
  });
});

export const listRefunds = asyncHandler(async (req, res) => {
  const result = await refundService.listRefunds(req.query, req.user);
  return sendSuccess(res, {
    message: 'Refunds',
    data: result.items,
    meta: result.meta,
  });
});

export const getRefund = asyncHandler(async (req, res) => {
  const data = await refundService.getRefund(req.params.id, req.user);
  return sendSuccess(res, { message: 'Refund', data });
});

export default {
  createRefund,
  listRefunds,
  getRefund,
};
