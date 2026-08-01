import { Router } from 'express';
import { z } from 'zod';
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
  buyerDepositSchema,
  buyerWalletAdjustSchema,
} from '../../validators/commerce.validator.js';
import { objectIdSchema, paginationSchema } from '../../validators/common.validator.js';
import * as walletController from '../../controllers/wallet/wallet.controller.js';
import * as buyerWalletController from '../../controllers/wallet/buyerWallet.controller.js';

const router = Router();

/** Buyer wallet (GET /wallet, /wallet/history, deposit, topup) */
router.get(
  '/',
  requireAuth,
  requireRole(USER_ROLES.BUYER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  buyerWalletController.getWallet,
);

router.get(
  '/history',
  requireAuth,
  requireRole(USER_ROLES.BUYER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validate({ query: paginationSchema.extend({
    type: z.string().optional(),
    status: z.string().optional(),
    direction: z.enum(['credit', 'debit']).optional(),
  }) }),
  buyerWalletController.getHistory,
);

router.post(
  '/deposit',
  requireAuth,
  requireRole(USER_ROLES.BUYER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validate(buyerDepositSchema),
  buyerWalletController.deposit,
);

router.post(
  '/topup',
  requireAuth,
  requireRole(USER_ROLES.BUYER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validate(buyerDepositSchema),
  buyerWalletController.topup,
);

/** Seller wallet (unchanged) */
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

/** Admin buyer wallet management */
router.get(
  '/buyer/transactions/export',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.WALLET_MANAGE),
  buyerWalletController.adminExportCsv,
);

router.get(
  '/buyer/transactions',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPPORT),
  requirePermission(PERMISSIONS.WALLET_READ),
  buyerWalletController.adminListTransactions,
);

router.get(
  '/buyer/:buyerId',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPPORT),
  requirePermission(PERMISSIONS.WALLET_READ),
  validate({ params: z.object({ buyerId: objectIdSchema }) }),
  buyerWalletController.adminGetBuyerWallet,
);

router.post(
  '/buyer/:buyerId/adjust',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.WALLET_MANAGE),
  validate({
    params: z.object({ buyerId: objectIdSchema }),
    body: buyerWalletAdjustSchema.body,
  }),
  buyerWalletController.adminAdjust,
);

router.post(
  '/buyer/:buyerId/freeze',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.WALLET_MANAGE),
  validate({
    params: z.object({ buyerId: objectIdSchema }),
    body: z.object({ reason: z.string().trim().max(500).optional() }),
  }),
  buyerWalletController.adminFreeze,
);

router.post(
  '/buyer/:buyerId/unfreeze',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.WALLET_MANAGE),
  validate({ params: z.object({ buyerId: objectIdSchema }) }),
  buyerWalletController.adminUnfreeze,
);

export default router;
