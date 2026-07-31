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
  listLedgerSchema,
  adjustWalletSchema,
} from '../../validators/commerce.validator.js';
import { objectIdSchema, paginationSchema } from '../../validators/common.validator.js';
import { z } from 'zod';
import * as walletController from '../../controllers/wallet/wallet.controller.js';

const router = Router();

router.get(
  '/me',
  requireAuth,
  requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.WALLET_READ),
  walletController.getMyWallet,
);

router.get(
  '/me/transactions',
  requireAuth,
  requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.WALLET_READ),
  validate({ query: paginationSchema }),
  walletController.listMyTransactions,
);

router.get(
  '/seller/:sellerId',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPPORT),
  requirePermission(PERMISSIONS.WALLET_READ),
  validate({ params: z.object({ sellerId: objectIdSchema }) }),
  walletController.getSellerWallet,
);

router.get(
  '/ledger',
  requireAuth,
  requirePermission(PERMISSIONS.LEDGER_READ),
  validate(listLedgerSchema),
  walletController.listLedger,
);

router.post(
  '/adjust',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.WALLET_MANAGE),
  validate(adjustWalletSchema),
  walletController.adjustWallet,
);

export default router;
