import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/index.js';
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
