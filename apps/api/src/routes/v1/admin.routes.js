import { Router } from 'express';
import {
  requireAuth,
  requireRole,
} from '../../middlewares/index.js';
import { USER_ROLES } from '../../constants/roles.js';
import * as adminController from '../../controllers/admin/admin.controller.js';

const router = Router();

router.use(
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPPORT),
);

router.get('/dashboard', adminController.dashboard);
router.get('/analytics', adminController.analytics);
router.get('/ocr-queue', adminController.ocrQueue);
router.get('/system-health', adminController.systemHealth);

export default router;
