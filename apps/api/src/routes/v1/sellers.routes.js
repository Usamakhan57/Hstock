import { Router } from 'express';
import { z } from 'zod';
import { validate, requireAuth, requireRole } from '../../middlewares/index.js';
import { USER_ROLES } from '../../constants/roles.js';
import { paginationSchema } from '../../validators/common.validator.js';
import * as publicSellersController from '../../controllers/publicSellers.controller.js';

const router = Router();

router.get(
  '/',
  validate({
    query: paginationSchema.extend({
      search: z.string().trim().max(120).optional(),
      verified: z.enum(['true', 'false']).optional(),
      promoted: z.enum(['true', 'false']).optional(),
    }),
  }),
  publicSellersController.list,
);

/** Authenticated seller dashboard stats — registered before /:slug */
router.get(
  '/me/statistics',
  requireAuth,
  requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  publicSellersController.myStatistics,
);

router.get(
  '/:slug',
  validate({
    params: z.object({
      slug: z.string().trim().min(1).max(160),
    }),
  }),
  publicSellersController.getBySlug,
);

export default router;
