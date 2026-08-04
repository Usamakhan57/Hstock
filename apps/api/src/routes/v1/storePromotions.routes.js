import { Router } from 'express';
import { z } from 'zod';
import {
  requireAuth,
  requireRole,
  validate,
} from '../../middlewares/index.js';
import { USER_ROLES } from '../../constants/roles.js';
import { objectIdSchema, paginationSchema } from '../../validators/common.validator.js';
import {
  STORE_PROMOTION_STATUS_VALUES,
} from '../../constants/storePromotion.js';
import * as storePromotionController from '../../controllers/storePromotion.controller.js';

const router = Router();

/** Seller — my promotion status + purchase (wallet only) */
router.get(
  '/me',
  requireAuth,
  requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  storePromotionController.getMyStatus,
);

router.post(
  '/me/purchase',
  requireAuth,
  requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  storePromotionController.purchase,
);

/** Admin — list / analytics / extend / cancel */
router.get(
  '/',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPPORT),
  validate({
    query: paginationSchema.extend({
      status: z.enum(STORE_PROMOTION_STATUS_VALUES).optional(),
      sellerId: objectIdSchema.optional(),
      active: z.enum(['true', 'false']).optional(),
    }),
  }),
  storePromotionController.adminList,
);

router.get(
  '/analytics',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPPORT),
  storePromotionController.adminAnalytics,
);

router.post(
  '/:id/extend',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validate({
    params: z.object({ id: objectIdSchema }),
    body: z.object({
      hours: z.number().positive().max(8760),
    }),
  }),
  storePromotionController.adminExtend,
);

router.post(
  '/:id/cancel',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validate({
    params: z.object({ id: objectIdSchema }),
    body: z.object({
      reason: z.string().trim().max(500).optional(),
    }).optional(),
  }),
  storePromotionController.adminCancel,
);

export default router;
