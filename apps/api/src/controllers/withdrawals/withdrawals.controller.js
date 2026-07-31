import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as withdrawalService from '../../services/withdrawal.service.js';

export const createWithdrawal = asyncHandler(async (req, res) => {
  const data = await withdrawalService.requestWithdrawal(req.body, req.user, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Withdrawal request created',
    data,
  });
});

export const listWithdrawals = asyncHandler(async (req, res) => {
  const result = await withdrawalService.listWithdrawals(req.query, req.user);
  return sendSuccess(res, {
    message: 'Withdrawals',
    data: result.items,
    meta: result.meta,
  });
});

export const getWithdrawal = asyncHandler(async (req, res) => {
  const data = await withdrawalService.getWithdrawal(req.params.id, req.user);
  return sendSuccess(res, { message: 'Withdrawal', data });
});

export const approveWithdrawal = asyncHandler(async (req, res) => {
  const data = await withdrawalService.approveWithdrawal(req.params.id, req.user, req.body);
  return sendSuccess(res, { message: 'Withdrawal approved', data });
});

export const rejectWithdrawal = asyncHandler(async (req, res) => {
  const data = await withdrawalService.rejectWithdrawal(req.params.id, req.user, req.body);
  return sendSuccess(res, { message: 'Withdrawal rejected', data });
});

export const payWithdrawal = asyncHandler(async (req, res) => {
  const data = await withdrawalService.markWithdrawalPaid(req.params.id, req.user, req.body);
  return sendSuccess(res, { message: 'Withdrawal marked paid', data });
});

export const cancelWithdrawal = asyncHandler(async (req, res) => {
  const data = await withdrawalService.cancelWithdrawal(req.params.id, req.user);
  return sendSuccess(res, { message: 'Withdrawal cancelled', data });
});

export default {
  createWithdrawal,
  listWithdrawals,
  getWithdrawal,
  approveWithdrawal,
  rejectWithdrawal,
  payWithdrawal,
  cancelWithdrawal,
};
