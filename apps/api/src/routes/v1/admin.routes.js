import { Router } from 'express';
import {
  requireAuth,
  requireRole,
  validate,
} from '../../middlewares/index.js';
import { USER_ROLES } from '../../constants/roles.js';
import * as adminController from '../../controllers/admin/admin.controller.js';
import * as telegramAdminController from '../../controllers/admin/telegramAdmin.controller.js';
import {
  telegramBroadcastSchema,
  telegramLogsQuerySchema,
  telegramBroadcastsQuerySchema,
  telegramUsersQuerySchema,
} from '../../validators/telegram.validator.js';

const router = Router();

router.use(
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPPORT),
);

router.get('/dashboard', adminController.dashboard);
router.get('/analytics', adminController.analytics);
router.get('/ocr-queue', adminController.ocrQueue);
router.get('/system-health', adminController.systemHealth);

router.get('/telegram', telegramAdminController.overview);
router.get('/telegram/status', telegramAdminController.botStatus);
router.get(
  '/telegram/users',
  validate(telegramUsersQuerySchema),
  telegramAdminController.connectedUsers,
);
router.get(
  '/telegram/logs',
  validate(telegramLogsQuerySchema),
  telegramAdminController.logs,
);
router.get(
  '/telegram/broadcasts',
  validate(telegramBroadcastsQuerySchema),
  telegramAdminController.broadcasts,
);
router.post(
  '/telegram/broadcasts',
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validate(telegramBroadcastSchema),
  telegramAdminController.createBroadcast,
);

export default router;
