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
  tagBodySchema,
  tagUpdateSchema,
  idParamSchema,
} from '../../validators/catalog.validator.js';
import * as catalogController from '../../controllers/catalog/catalog.controller.js';

const router = Router();

router.get('/', validate(listQuerySchema), catalogController.listTags);
router.get('/:idOrSlug', validate(idOrSlugParamSchema), catalogController.getTag);

router.post(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.TAGS_WRITE),
  validate(tagBodySchema),
  catalogController.createTag,
);
router.patch(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.TAGS_WRITE),
  validate(tagUpdateSchema),
  catalogController.updateTag,
);
router.delete(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.TAGS_WRITE),
  validate(idParamSchema),
  catalogController.deleteTag,
);

export default router;
