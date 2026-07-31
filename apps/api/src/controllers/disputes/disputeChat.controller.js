import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as disputeChatService from '../../services/disputeChat.service.js';

function requestMeta(req) {
  return {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };
}

export const getChat = asyncHandler(async (req, res) => {
  const data = await disputeChatService.getDisputeChat(req.params.id, req.user);
  return sendSuccess(res, { message: 'Dispute chat', data });
});

export const listMessages = asyncHandler(async (req, res) => {
  const result = await disputeChatService.listMessages(req.params.id, req.query, req.user);
  return sendSuccess(res, {
    message: 'Dispute chat messages',
    data: result.items,
    meta: result.meta,
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const data = await disputeChatService.sendMessage(
    req.params.id,
    req.body,
    req.user,
    requestMeta(req),
  );
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Message sent',
    data,
  });
});

export const editMessage = asyncHandler(async (req, res) => {
  const data = await disputeChatService.editMessage(
    req.params.id,
    req.params.messageId,
    req.body,
    req.user,
    requestMeta(req),
  );
  return sendSuccess(res, { message: 'Message updated', data });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const data = await disputeChatService.deleteMessage(
    req.params.id,
    req.params.messageId,
    req.user,
    requestMeta(req),
  );
  return sendSuccess(res, { message: 'Message deleted', data });
});

export const assignAdmin = asyncHandler(async (req, res) => {
  const data = await disputeChatService.assignAdmin(
    req.params.id,
    req.user,
    requestMeta(req),
  );
  return sendSuccess(res, { message: 'Admin assigned to dispute chat', data });
});

export const listBlockedAttempts = asyncHandler(async (req, res) => {
  const result = await disputeChatService.listBlockedAttempts(
    req.params.id,
    req.query,
    req.user,
  );
  return sendSuccess(res, {
    message: 'Blocked chat attempts',
    data: result.items,
    meta: result.meta,
  });
});

export const listAuditLogs = asyncHandler(async (req, res) => {
  const result = await disputeChatService.listAuditLogs(
    req.params.id,
    req.query,
    req.user,
  );
  return sendSuccess(res, {
    message: 'Dispute chat audit log',
    data: result.items,
    meta: result.meta,
  });
});

export const listViolations = asyncHandler(async (req, res) => {
  const result = await disputeChatService.listViolations(req.query, req.user);
  return sendSuccess(res, {
    message: 'Dispute chat violations',
    data: result.items,
    meta: result.meta,
  });
});

export const listFlaggedAttachments = asyncHandler(async (req, res) => {
  const result = await disputeChatService.listFlaggedAttachments(
    req.params.id,
    req.query,
    req.user,
  );
  return sendSuccess(res, {
    message: 'Flagged evidence screenshots',
    data: result.items,
    meta: result.meta,
  });
});

export const reviewFlaggedAttachment = asyncHandler(async (req, res) => {
  const data = await disputeChatService.reviewFlaggedAttachment(
    req.params.id,
    req.params.messageId,
    req.params.attachmentId,
    req.body,
    req.user,
    requestMeta(req),
  );
  return sendSuccess(res, {
    message: 'Attachment review saved',
    data,
  });
});

export const sendCredentials = asyncHandler(async (req, res) => {
  const data = await disputeChatService.sendCredentials(
    req.params.id,
    req.body,
    req.user,
    requestMeta(req),
  );
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Credentials shared securely',
    data,
  });
});

export const revealCredentials = asyncHandler(async (req, res) => {
  const data = await disputeChatService.revealCredentials(
    req.params.id,
    req.params.messageId,
    req.user,
    requestMeta(req),
  );
  return sendSuccess(res, { message: 'Credentials revealed', data });
});

export default {
  getChat,
  listMessages,
  sendMessage,
  sendCredentials,
  revealCredentials,
  editMessage,
  deleteMessage,
  assignAdmin,
  listBlockedAttempts,
  listAuditLogs,
  listViolations,
  listFlaggedAttachments,
  reviewFlaggedAttachment,
};
