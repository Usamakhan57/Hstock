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
  listPaymentsSchema,
  paymentIdSchema,
} from '../../validators/commerce.validator.js';
import * as paymentsController from '../../controllers/payments/payments.controller.js';

const router = Router();

/** Public Cryptomus webhook — signature verified in service */
router.post('/cryptomus/webhook', paymentsController.cryptomusWebhook);

/** Non-production sandbox confirm for simulated invoices */
router.post('/cryptomus/sandbox/:uuid', paymentsController.sandboxConfirm);

router.get(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.PAYMENTS_READ),
  validate(listPaymentsSchema),
  paymentsController.listPayments,
);

router.get(
  '/cryptomus/services',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  paymentsController.listCryptomusServices,
);

/** Authenticated buyers/sellers — dynamic Cryptomus currencies + networks for checkout */
router.get(
  '/cryptomus/checkout-assets',
  requireAuth,
  requirePermission(PERMISSIONS.PAYMENTS_READ),
  paymentsController.listCheckoutAssets,
);

router.get(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.PAYMENTS_READ),
  validate(paymentIdSchema),
  paymentsController.getPayment,
);

router.post(
  '/:id/sync',
  requireAuth,
  requirePermission(PERMISSIONS.PAYMENTS_READ),
  validate(paymentIdSchema),
  paymentsController.syncPayment,
);

export default router;
