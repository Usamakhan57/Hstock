import { Router } from 'express';
import { z } from 'zod';
import {
  requireAuth,
  requireRole,
  validate,
} from '../../middlewares/index.js';
import { USER_ROLES } from '../../constants/roles.js';
import { objectIdSchema, paginationSchema } from '../../validators/common.validator.js';
import * as sellerVerificationController from '../../controllers/sellerVerification.controller.js';

const router = Router();

router.get(
  '/me',
  requireAuth,
  requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  sellerVerificationController.getMyStatus,
);

router.post(
  '/me/purchase',
  requireAuth,
  requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  sellerVerificationController.purchase,
);

router.get(
  '/',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPPORT),
  validate({
    query: paginationSchema.extend({
      search: z.string().trim().max(120).optional(),
      verified: z.enum(['true', 'false', 'all']).optional(),
    }),
  }),
  sellerVerificationController.adminList,
);

router.post(
  '/:id/verify',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validate({
    params: z.object({ id: objectIdSchema }),
  }),
  sellerVerificationController.adminVerify,
);

router.post(
  '/:id/unverify',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validate({
    params: z.object({ id: objectIdSchema }),
    body: z.object({
      refund: z.boolean().optional(),
    }).optional(),
  }),
  sellerVerificationController.adminUnverify,
);

export default router;
