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
  listEscrowsSchema,
  escrowIdSchema,
  releaseEscrowSchema,
} from '../../validators/commerce.validator.js';
import * as escrowController from '../../controllers/escrow/escrow.controller.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.ESCROW_READ),
  validate(listEscrowsSchema),
  escrowController.listEscrows,
);

router.get(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.ESCROW_READ),
  validate(escrowIdSchema),
  escrowController.getEscrow,
);

router.post(
  '/:id/release',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.ESCROW_MANAGE),
  validate(releaseEscrowSchema),
  escrowController.releaseEscrow,
);

export default router;
