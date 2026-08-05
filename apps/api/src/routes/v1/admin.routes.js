import { Router } from 'express';
import { z } from 'zod';
import {
  requireAuth,
  requireRole,
  validate,
} from '../../middlewares/index.js';
import { USER_ROLES } from '../../constants/roles.js';
import * as adminController from '../../controllers/admin/admin.controller.js';
import * as telegramAdminController from '../../controllers/admin/telegramAdmin.controller.js';
import * as sellerDeleteController from '../../controllers/admin/sellerDelete.controller.js';
import * as adminUserDeleteController from '../../controllers/admin/adminUserDelete.controller.js';
import {
  telegramBroadcastSchema,
  telegramLogsQuerySchema,
  telegramBroadcastsQuerySchema,
  telegramUsersQuerySchema,
} from '../../validators/telegram.validator.js';
import { objectIdSchema } from '../../validators/common.validator.js';

const router = Router();

router.use(
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPPORT),
);

router.get('/dashboard', adminController.dashboard);
router.get('/analytics', adminController.analytics);
router.get('/ocr-queue', adminController.ocrQueue);
router.get('/system-health', adminController.systemHealth);

/** Soft-delete staff/admin user — Super Admin only. */
router.delete(
  '/users/:id',
  requireRole(USER_ROLES.SUPER_ADMIN),
  validate({
    params: z.object({ id: objectIdSchema }),
    body: z.object({
      confirm: z.string().trim().optional(),
    }).optional(),
  }),
  adminUserDeleteController.adminDeleteUser,
);

/** Soft-delete seller — admin / super_admin. Super Admin may force=true to skip blockers. */
router.delete(
  '/sellers/:id',
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validate({
    params: z.object({ id: objectIdSchema }),
    body: z.object({
      confirm: z.string().trim().optional(),
      force: z.union([z.boolean(), z.string(), z.number()]).optional(),
      acknowledge: z.union([z.boolean(), z.string(), z.number()]).optional(),
    }).optional(),
  }),
  sellerDeleteController.adminDeleteSeller,
);

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
