import { Router } from 'express';
import {
  validate,
  requireAuth,
  requirePermission,
} from '../../middlewares/index.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import {
  cmsKeyParamsSchema,
  updateCmsDocumentSchema,
} from '../../validators/cms.validator.js';
import * as cmsController from '../../controllers/cms/cms.controller.js';

const router = Router();

/** Public — storefront reads CMS without auth. */
router.get('/versions', cmsController.getVersions);
router.get('/', cmsController.getDocuments);
router.get('/:key', validate(cmsKeyParamsSchema), cmsController.getDocument);

/** Admin writes — requires config:write (admins/super_admins). */
router.put(
  '/:key',
  requireAuth,
  requirePermission(PERMISSIONS.CONFIG_WRITE),
  validate(updateCmsDocumentSchema),
  cmsController.updateDocument,
);

export default router;
