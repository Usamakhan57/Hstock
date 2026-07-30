import { Router } from 'express';
import {
  validate,
  requireAuth,
  requirePermission,
} from '../../middlewares/index.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import {
  listQuerySchema,
  idOrSlugParamSchema,
  brandBodySchema,
  brandUpdateSchema,
  idParamSchema,
} from '../../validators/catalog.validator.js';
import * as catalogController from '../../controllers/catalog/catalog.controller.js';

const router = Router();

router.get('/', validate(listQuerySchema), catalogController.listBrands);
router.get('/:idOrSlug', validate(idOrSlugParamSchema), catalogController.getBrand);

router.post(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.BRANDS_WRITE),
  validate(brandBodySchema),
  catalogController.createBrand,
);
router.patch(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.BRANDS_WRITE),
  validate(brandUpdateSchema),
  catalogController.updateBrand,
);
router.delete(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.BRANDS_WRITE),
  validate(idParamSchema),
  catalogController.deleteBrand,
);

export default router;
