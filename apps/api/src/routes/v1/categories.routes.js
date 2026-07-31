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
  categoryBodySchema,
  categoryUpdateSchema,
  idParamSchema,
} from '../../validators/catalog.validator.js';
import * as catalogController from '../../controllers/catalog/catalog.controller.js';

const router = Router();

router.get('/', validate(listQuerySchema), catalogController.listCategories);
router.get(
  '/:idOrSlug',
  validate(idOrSlugParamSchema),
  catalogController.getCategory,
);

router.post(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.CATEGORIES_WRITE),
  validate(categoryBodySchema),
  catalogController.createCategory,
);
router.patch(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.CATEGORIES_WRITE),
  validate(categoryUpdateSchema),
  catalogController.updateCategory,
);
router.delete(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.CATEGORIES_WRITE),
  validate(idParamSchema),
  catalogController.deleteCategory,
);

export default router;
