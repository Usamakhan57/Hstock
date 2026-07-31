import { Router } from 'express';
import {
  validate,
  requireAuth,
  requirePermission,
} from '../../middlewares/index.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import {
  updateSystemConfigSchema,
  updatePlatformConfigSchema,
  updateCommissionConfigSchema,
} from '../../validators/config.validator.js';
import * as configController from '../../controllers/config/config.controller.js';

const router = Router();

router.get('/seller-registration-fee', configController.getSellerRegistrationFee);
router.get('/platform', configController.getPlatformConfig);

router.use(requireAuth);

router.get(
  '/',
  requirePermission(PERMISSIONS.CONFIG_READ),
  configController.getConfigs,
);
router.get(
  '/system',
  requirePermission(PERMISSIONS.CONFIG_READ),
  configController.getSystemConfig,
);
router.get(
  '/commission',
  requirePermission(PERMISSIONS.CONFIG_READ),
  configController.getCommissionConfig,
);

router.put(
  '/system',
  requirePermission(PERMISSIONS.CONFIG_WRITE),
  validate(updateSystemConfigSchema),
  configController.updateSystemConfig,
);
router.put(
  '/platform',
  requirePermission(PERMISSIONS.CONFIG_WRITE),
  validate(updatePlatformConfigSchema),
  configController.updatePlatformConfig,
);
router.put(
  '/commission',
  requirePermission(PERMISSIONS.CONFIG_WRITE),
  validate(updateCommissionConfigSchema),
  configController.updateCommissionConfig,
);

export default router;
