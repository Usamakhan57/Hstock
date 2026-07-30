import { Router } from 'express';
import {
  validate,
  requireAuth,
  requireRole,
  requirePermission,
} from '../../middlewares/index.js';
import { USER_ROLES } from '../../constants/roles.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import {
  updateMeSchema,
  updateBuyerProfileSchema,
  updateSellerProfileSchema,
  changePasswordSchema,
  listUsersSchema,
  adminUpdateUserSchema,
  adminUpdateSellerSchema,
} from '../../validators/user.validator.js';
import * as usersController from '../../controllers/users/users.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/me', usersController.getMe);
router.patch('/me', validate(updateMeSchema), usersController.updateMe);
router.patch(
  '/me/profile',
  validate(updateBuyerProfileSchema),
  usersController.updateBuyerProfile,
);
router.patch(
  '/me/seller-profile',
  requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validate(updateSellerProfileSchema),
  usersController.updateSellerProfile,
);
router.post(
  '/me/change-password',
  validate(changePasswordSchema),
  usersController.changePassword,
);
router.get('/me/activity', usersController.myActivity);

router.get(
  '/',
  requirePermission(PERMISSIONS.USERS_MANAGE),
  validate(listUsersSchema),
  usersController.listUsers,
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.USERS_MANAGE),
  validate(adminUpdateUserSchema),
  usersController.adminUpdateUser,
);

router.patch(
  '/sellers/:id',
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validate(adminUpdateSellerSchema),
  usersController.adminUpdateSeller,
);

export default router;
