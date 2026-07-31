import { Router } from 'express';
import {
  validate,
  requireAuth,
  requireRole,
  requirePermission,
} from '../../middlewares/index.js';
import { USER_ROLES } from '../../constants/roles.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import {
  openDisputeSchema,
  listDisputesSchema,
  disputeIdSchema,
  disputeMessageSchema,
  resolveDisputeSchema,
} from '../../validators/commerce.validator.js';
import * as disputesController from '../../controllers/disputes/disputes.controller.js';

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
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.DISPUTES_READ),
  validate(disputeIdSchema),
  disputesController.getDispute,
);

router.post(
  '/:id/messages',
  requireAuth,
  requirePermission(PERMISSIONS.DISPUTES_WRITE),
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

export default router;
