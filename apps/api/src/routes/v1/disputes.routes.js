import { Router } from 'express';
import {
  validate,
  requireAuth,
  requireRole,
  requirePermission,
} from '../../middlewares/index.js';
import { disputeChatRateLimiter } from '../../middlewares/rateLimit.middleware.js';
import { USER_ROLES } from '../../constants/roles.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import {
  openDisputeSchema,
  listDisputesSchema,
  disputeIdSchema,
  disputeMessageSchema,
  resolveDisputeSchema,
  extendSellerReplacementDeadlineSchema,
  listDisputeChatMessagesSchema,
  editDisputeChatMessageSchema,
  disputeChatMessageIdSchema,
  listDisputeChatBlockedSchema,
  listDisputeChatAuditSchema,
  listDisputeChatViolationsSchema,
  listFlaggedAttachmentsSchema,
  reviewFlaggedAttachmentSchema,
  sendChatCredentialsSchema,
  revealCredentialsSchema,
  sendReplacementSchema,
  respondReplacementSchema,
  revealReplacementCredentialsSchema,
} from '../../validators/commerce.validator.js';
import * as disputesController from '../../controllers/disputes/disputes.controller.js';
import * as disputeChatController from '../../controllers/disputes/disputeChat.controller.js';
import * as disputeReplacementController from '../../controllers/disputes/disputeReplacement.controller.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireRole(USER_ROLES.BUYER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.DISPUTES_WRITE),
  validate(openDisputeSchema),
  disputesController.openDispute,
);

router.get(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.DISPUTES_READ),
  validate(listDisputesSchema),
  disputesController.listDisputes,
);

router.get(
  '/violations',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPPORT),
  requirePermission(PERMISSIONS.DISPUTES_MANAGE),
  validate(listDisputeChatViolationsSchema),
  disputeChatController.listViolations,
);

router.get(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.DISPUTES_READ),
  validate(disputeIdSchema),
  disputesController.getDispute,
);

router.get(
  '/:id/dashboard',
  requireAuth,
  requirePermission(PERMISSIONS.DISPUTES_READ),
  validate(disputeIdSchema),
  disputeReplacementController.getDashboard,
);

router.get(
  '/:id/timeline',
  requireAuth,
  requirePermission(PERMISSIONS.DISPUTES_READ),
  validate(disputeIdSchema),
  disputeReplacementController.getTimeline,
);

// Legacy-compatible message endpoint (secure filter applied)
router.post(
  '/:id/messages',
  requireAuth,
  requirePermission(PERMISSIONS.DISPUTES_WRITE),
  disputeChatRateLimiter,
  validate(disputeMessageSchema),
  disputesController.addMessage,
);

router.post(
  '/:id/resolve',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.DISPUTES_MANAGE),
  validate(resolveDisputeSchema),
  disputesController.resolveDispute,
);

router.post(
  '/:id/extend-replacement',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPPORT),
  requirePermission(PERMISSIONS.DISPUTES_MANAGE),
  validate(extendSellerReplacementDeadlineSchema),
  disputesController.extendSellerReplacementDeadline,
);

// ---- Replacement accounts ----

router.get(
  '/:id/replacements',
  requireAuth,
  requirePermission(PERMISSIONS.DISPUTES_READ),
  validate(disputeIdSchema),
  disputeReplacementController.listReplacements,
);

router.post(
  '/:id/replacements',
  requireAuth,
  requireRole(USER_ROLES.SELLER, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.DISPUTES_WRITE),
  disputeChatRateLimiter,
  validate(sendReplacementSchema),
  disputeReplacementController.sendReplacement,
);

router.post(
  '/:id/replacements/:replacementId/respond',
  requireAuth,
  requireRole(USER_ROLES.BUYER, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.DISPUTES_WRITE),
  validate(respondReplacementSchema),
  disputeReplacementController.respondToReplacement,
);

router.post(
  '/:id/replacements/:replacementId/reveal',
  requireAuth,
  requirePermission(PERMISSIONS.DISPUTES_READ),
  validate({
    params: respondReplacementSchema.params.pick({ id: true, replacementId: true }),
  }),
  disputeReplacementController.revealReplacementBlob,
);

router.post(
  '/:id/replacements/:replacementId/accounts/:accountId/reveal',
  requireAuth,
  requirePermission(PERMISSIONS.DISPUTES_READ),
  validate(revealReplacementCredentialsSchema),
  disputeReplacementController.revealReplacementCredentials,
);

// ---- Secure dispute chat ----

router.get(
  '/:id/chat',
  requireAuth,
  requirePermission(PERMISSIONS.DISPUTES_READ),
  validate(disputeIdSchema),
  disputeChatController.getChat,
);

router.get(
  '/:id/chat/messages',
  requireAuth,
  requirePermission(PERMISSIONS.DISPUTES_READ),
  validate(listDisputeChatMessagesSchema),
  disputeChatController.listMessages,
);

router.post(
  '/:id/chat/messages',
  requireAuth,
  requirePermission(PERMISSIONS.DISPUTES_WRITE),
  disputeChatRateLimiter,
  validate(disputeMessageSchema),
  disputeChatController.sendMessage,
);

router.post(
  '/:id/chat/credentials',
  requireAuth,
  requirePermission(PERMISSIONS.DISPUTES_WRITE),
  disputeChatRateLimiter,
  validate(sendChatCredentialsSchema),
  disputeChatController.sendCredentials,
);

router.post(
  '/:id/chat/messages/:messageId/reveal',
  requireAuth,
  requirePermission(PERMISSIONS.DISPUTES_READ),
  validate(revealCredentialsSchema),
  disputeChatController.revealCredentials,
);

router.patch(
  '/:id/chat/messages/:messageId',
  requireAuth,
  requirePermission(PERMISSIONS.DISPUTES_WRITE),
  disputeChatRateLimiter,
  validate(editDisputeChatMessageSchema),
  disputeChatController.editMessage,
);

router.delete(
  '/:id/chat/messages/:messageId',
  requireAuth,
  requirePermission(PERMISSIONS.DISPUTES_WRITE),
  validate(disputeChatMessageIdSchema),
  disputeChatController.deleteMessage,
);

router.post(
  '/:id/chat/assign',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPPORT),
  requirePermission(PERMISSIONS.DISPUTES_MANAGE),
  validate(disputeIdSchema),
  disputeChatController.assignAdmin,
);

router.get(
  '/:id/chat/blocked-attempts',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPPORT),
  requirePermission(PERMISSIONS.DISPUTES_MANAGE),
  validate(listDisputeChatBlockedSchema),
  disputeChatController.listBlockedAttempts,
);

router.get(
  '/:id/chat/audit',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPPORT),
  requirePermission(PERMISSIONS.DISPUTES_MANAGE),
  validate(listDisputeChatAuditSchema),
  disputeChatController.listAuditLogs,
);

router.get(
  '/:id/chat/flagged-attachments',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPPORT),
  requirePermission(PERMISSIONS.DISPUTES_MANAGE),
  validate(listFlaggedAttachmentsSchema),
  disputeChatController.listFlaggedAttachments,
);

router.post(
  '/:id/chat/messages/:messageId/attachments/:attachmentId/review',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPPORT),
  requirePermission(PERMISSIONS.DISPUTES_MANAGE),
  validate(reviewFlaggedAttachmentSchema),
  disputeChatController.reviewFlaggedAttachment,
);

export default router;
