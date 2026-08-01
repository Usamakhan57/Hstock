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
  adminSellerIdSchema,
} from '../../validators/user.validator.js';
import { paginationSchema } from '../../validators/common.validator.js';
import { z } from 'zod';
import { SellerStatusEnum } from '../../constants/enums.js';
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

const adminSellerGuards = [
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
];

const listSellersSchema = {
  query: paginationSchema.extend({
    status: z.enum(Object.values(SellerStatusEnum)).optional(),
    search: z.string().trim().optional(),
  }),
};

// Seller admin routes before /:id so "sellers" is never treated as a user id.
router.get(
  '/sellers',
  ...adminSellerGuards,
  validate(listSellersSchema),
  usersController.adminListSellers,
);
router.get(
  '/sellers/:id',
  ...adminSellerGuards,
  validate(adminSellerIdSchema),
  usersController.adminGetSeller,
);
router.patch(
  '/sellers/:id',
  ...adminSellerGuards,
  validate(adminUpdateSellerSchema),
  usersController.adminUpdateSeller,
);
// Singular aliases used by some admin clients / network traces.
router.get(
  '/seller/:id',
  ...adminSellerGuards,
  validate(adminSellerIdSchema),
  usersController.adminGetSeller,
);
router.patch(
  '/seller/:id',
  ...adminSellerGuards,
  validate(adminUpdateSellerSchema),
  usersController.adminUpdateSeller,
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.USERS_MANAGE),
  validate(adminUpdateUserSchema),
  usersController.adminUpdateUser,
);

export default router;
