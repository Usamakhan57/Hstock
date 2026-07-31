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
  createWithdrawalSchema,
  listWithdrawalsSchema,
  withdrawalIdSchema,
  approveWithdrawalSchema,
  rejectWithdrawalSchema,
  payWithdrawalSchema,
} from '../../validators/commerce.validator.js';
import * as withdrawalsController from '../../controllers/withdrawals/withdrawals.controller.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.WITHDRAWALS_WRITE),
  validate(createWithdrawalSchema),
  withdrawalsController.createWithdrawal,
);

router.get(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.WITHDRAWALS_READ),
  validate(listWithdrawalsSchema),
  withdrawalsController.listWithdrawals,
);

router.get(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.WITHDRAWALS_READ),
  validate(withdrawalIdSchema),
  withdrawalsController.getWithdrawal,
);

router.post(
  '/:id/approve',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.WITHDRAWALS_MANAGE),
  validate(approveWithdrawalSchema),
  withdrawalsController.approveWithdrawal,
);

router.post(
  '/:id/reject',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.WITHDRAWALS_MANAGE),
  validate(rejectWithdrawalSchema),
  withdrawalsController.rejectWithdrawal,
);

router.post(
  '/:id/pay',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.WITHDRAWALS_MANAGE),
  validate(payWithdrawalSchema),
  withdrawalsController.payWithdrawal,
);

router.post(
  '/:id/cancel',
  requireAuth,
  requirePermission(PERMISSIONS.WITHDRAWALS_WRITE),
  validate(withdrawalIdSchema),
  withdrawalsController.cancelWithdrawal,
);

export default router;
