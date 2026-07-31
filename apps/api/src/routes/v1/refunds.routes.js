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
  createRefundSchema,
  listRefundsSchema,
  refundIdSchema,
} from '../../validators/commerce.validator.js';
import * as refundsController from '../../controllers/refunds/refunds.controller.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.REFUNDS_MANAGE),
  validate(createRefundSchema),
  refundsController.createRefund,
);

router.get(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.REFUNDS_READ),
  validate(listRefundsSchema),
  refundsController.listRefunds,
);

router.get(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.REFUNDS_READ),
  validate(refundIdSchema),
  refundsController.getRefund,
);

export default router;
