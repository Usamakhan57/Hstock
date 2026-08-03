import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as disputeReplacementService from '../../services/disputeReplacement.service.js';
import * as disputeService from '../../services/dispute.service.js';

function requestMeta(req) {
  return {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };
}

export const sendReplacement = asyncHandler(async (req, res) => {
  const data = await disputeReplacementService.sendReplacement(
    req.params.id,
    req.body,
    req.user,
    requestMeta(req),
  );
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Replacement sent',
    data,
  });
});

export const listReplacements = asyncHandler(async (req, res) => {
  const data = await disputeReplacementService.listReplacements(req.params.id, req.user);
  return sendSuccess(res, { message: 'Replacement history', data });
});

export const respondToReplacement = asyncHandler(async (req, res) => {
  const data = await disputeReplacementService.respondToReplacement(
    req.params.id,
    req.params.replacementId,
    req.body,
    req.user,
    requestMeta(req),
  );
  return sendSuccess(res, { message: 'Replacement response recorded', data });
});

export const revealReplacementCredentials = asyncHandler(async (req, res) => {
  const data = await disputeReplacementService.revealReplacementAccount(
    req.params.id,
    req.params.replacementId,
    req.params.accountId,
    req.user,
    requestMeta(req),
  );
  return sendSuccess(res, { message: 'Replacement credentials revealed', data });
});

export const revealReplacementBlob = asyncHandler(async (req, res) => {
  const data = await disputeReplacementService.revealReplacementBlob(
    req.params.id,
    req.params.replacementId,
    req.user,
    requestMeta(req),
  );
  return sendSuccess(res, { message: 'Replacement credentials revealed', data });
});

export const getDashboard = asyncHandler(async (req, res) => {
  const data = await disputeService.getDisputeDashboard(req.params.id, req.user);
  return sendSuccess(res, { message: 'Dispute dashboard', data });
});

export const getTimeline = asyncHandler(async (req, res) => {
  const data = await disputeService.getDisputeTimeline(req.params.id, req.user);
  return sendSuccess(res, { message: 'Dispute timeline', data });
});

export default {
  sendReplacement,
  listReplacements,
  respondToReplacement,
  revealReplacementCredentials,
  revealReplacementBlob,
  getDashboard,
  getTimeline,
};
