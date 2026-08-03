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
  buyNowSchema,
  orderIdSchema,
  listOrdersSchema,
  cancelOrderSchema,
  deliverOrderSchema,
} from '../../validators/commerce.validator.js';
import * as ordersController from '../../controllers/orders/orders.controller.js';

const router = Router();

// Buyer Instant Access credentials (available after payment; survives completion)

router.post(
  '/buy-now',
  requireAuth,
  requireRole(USER_ROLES.BUYER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  requirePermission(PERMISSIONS.ORDERS_WRITE),
  validate(buyNowSchema),
  ordersController.buyNow,
);

router.get(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.ORDERS_READ),
  validate(listOrdersSchema),
  ordersController.listOrders,
);

router.get(
  '/:id/delivery',
  requireAuth,
  requirePermission(PERMISSIONS.ORDERS_READ),
  validate(orderIdSchema),
  ordersController.getDelivery,
);

router.get(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.ORDERS_READ),
  validate(orderIdSchema),
  ordersController.getOrder,
);

router.post(
  '/:id/cancel',
  requireAuth,
  requirePermission(PERMISSIONS.ORDERS_WRITE),
  validate(cancelOrderSchema),
  ordersController.cancelOrder,
);

router.post(
  '/:id/deliver',
  requireAuth,
  requireRole(
    USER_ROLES.SELLER,
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
  ),
  validate(deliverOrderSchema),
  ordersController.markDelivered,
);

export default router;
