import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as disputeService from '../../services/dispute.service.js';

export const openDispute = asyncHandler(async (req, res) => {
  const data = await disputeService.openDispute(req.body, req.user, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  return sendSuccess(res, {
    statusCode: 201,
    message: data.isPartial
      ? 'Partial dispute opened — only disputed quantity held in escrow'
      : 'Dispute opened — escrow frozen',
    data,
  });
});

export const listDisputes = asyncHandler(async (req, res) => {
  const result = await disputeService.listDisputes(req.query, req.user);
  return sendSuccess(res, {
    message: 'Disputes',
    data: result.items,
    meta: result.meta,
  });
});

export const getDispute = asyncHandler(async (req, res) => {
  const data = await disputeService.getDispute(req.params.id, req.user);
  return sendSuccess(res, { message: 'Dispute', data });
});

export const addMessage = asyncHandler(async (req, res) => {
  const data = await disputeService.addDisputeMessage(
    req.params.id,
    req.body,
    req.user,
    { ip: req.ip, userAgent: req.get('user-agent') },
  );
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Message added',
    data,
  });
});

export const resolveDispute = asyncHandler(async (req, res) => {
  const data = await disputeService.resolveDispute(req.params.id, req.body, req.user);
  return sendSuccess(res, { message: 'Dispute resolved', data });
});

export const extendSellerReplacementDeadline = asyncHandler(async (req, res) => {
  const data = await disputeService.extendSellerReplacementDeadline(
    req.params.id,
    req.body,
    req.user,
  );
  return sendSuccess(res, {
    message: 'Seller replacement deadline extended',
    data,
  });
});

export default {
  openDispute,
  listDisputes,
  getDispute,
  addMessage,
  resolveDispute,
  extendSellerReplacementDeadline,
};
