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
  collectionBodySchema,
  collectionUpdateSchema,
  idParamSchema,
} from '../../validators/catalog.validator.js';
import * as catalogController from '../../controllers/catalog/catalog.controller.js';

const router = Router();

router.get('/', validate(listQuerySchema), catalogController.listCollections);
router.get(
  '/:idOrSlug',
  validate(idOrSlugParamSchema),
  catalogController.getCollection,
);

router.post(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.COLLECTIONS_WRITE),
  validate(collectionBodySchema),
  catalogController.createCollection,
);
router.patch(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.COLLECTIONS_WRITE),
  validate(collectionUpdateSchema),
  catalogController.updateCollection,
);
router.delete(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.COLLECTIONS_WRITE),
  validate(idParamSchema),
  catalogController.deleteCollection,
);

export default router;
