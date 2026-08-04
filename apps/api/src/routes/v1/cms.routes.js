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

/** Public — storefront reads published CMS only (never email_templates / drafts). */
router.get('/versions', cmsController.getVersions);
router.get('/', cmsController.getDocuments);

/** Admin reads — full payload including drafts & email templates. */
router.get(
  '/admin/versions',
  requireAuth,
  requirePermission(PERMISSIONS.CONFIG_READ),
  cmsController.getAdminVersions,
);
router.get(
  '/admin',
  requireAuth,
  requirePermission(PERMISSIONS.CONFIG_READ),
  cmsController.getAdminDocuments,
);
router.get(
  '/admin/:key',
  requireAuth,
  requirePermission(PERMISSIONS.CONFIG_READ),
  validate(cmsKeyParamsSchema),
  cmsController.getAdminDocument,
);

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
