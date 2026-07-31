import { Router } from 'express';
import { sendSuccess } from '../../utils/response.js';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import configRoutes from './config.routes.js';
import categoriesRoutes from './categories.routes.js';
import brandsRoutes from './brands.routes.js';
import tagsRoutes from './tags.routes.js';
import productsRoutes from './products.routes.js';
import ordersRoutes from './orders.routes.js';
import paymentsRoutes from './payments.routes.js';
import escrowRoutes from './escrow.routes.js';
import walletRoutes from './wallet.routes.js';
import withdrawalsRoutes from './withdrawals.routes.js';
import disputesRoutes from './disputes.routes.js';
import refundsRoutes from './refunds.routes.js';
import notificationsRoutes from './notifications.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

/**
 * API v1 — Auth, Catalog, Commerce Core, Notifications, Admin ops.
 */
router.get('/', (_req, res) => {
  return sendSuccess(res, {
    message: 'ApnaStore API v1',
    data: {
      version: 'v1',
      phase: 'production',
      modules: [
        'auth',
        'users',
        'config',
        'categories',
        'brands',
        'tags',
        'products',
        'orders',
        'payments',
        'escrow',
        'wallet',
        'withdrawals',
        'disputes',
        'dispute-chat',
        'refunds',
        'notifications',
        'admin',
      ],
      health: '/health',
      socket: '/socket.io',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/config', configRoutes);
router.use('/categories', categoriesRoutes);
router.use('/brands', brandsRoutes);
router.use('/tags', tagsRoutes);
router.use('/products', productsRoutes);
router.use('/orders', ordersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/escrow', escrowRoutes);
router.use('/wallet', walletRoutes);
router.use('/withdrawals', withdrawalsRoutes);
router.use('/disputes', disputesRoutes);
router.use('/refunds', refundsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/admin', adminRoutes);

export default router;
