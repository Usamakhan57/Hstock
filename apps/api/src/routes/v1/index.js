import { Router } from 'express';
import { sendSuccess } from '../../utils/response.js';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import configRoutes from './config.routes.js';
import categoriesRoutes from './categories.routes.js';
import brandsRoutes from './brands.routes.js';
import collectionsRoutes from './collections.routes.js';
import tagsRoutes from './tags.routes.js';
import productsRoutes from './products.routes.js';
import ordersRoutes from './orders.routes.js';
import paymentsRoutes from './payments.routes.js';
import escrowRoutes from './escrow.routes.js';
import walletRoutes from './wallet.routes.js';
import withdrawalsRoutes from './withdrawals.routes.js';
import disputesRoutes from './disputes.routes.js';
import refundsRoutes from './refunds.routes.js';

const router = Router();

/**
 * API v1 — Phase 1 foundation + Phase 2 catalog + Commerce Core.
 */
router.get('/', (_req, res) => {
  return sendSuccess(res, {
    message: 'HStock API v1',
    data: {
      version: 'v1',
      phase: 'commerce-core',
      modules: [
        'auth',
        'users',
        'config',
        'categories',
        'brands',
        'collections',
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
      ],
      health: '/health',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/config', configRoutes);
router.use('/categories', categoriesRoutes);
router.use('/brands', brandsRoutes);
router.use('/collections', collectionsRoutes);
router.use('/tags', tagsRoutes);
router.use('/products', productsRoutes);
router.use('/orders', ordersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/escrow', escrowRoutes);
router.use('/wallet', walletRoutes);
router.use('/withdrawals', withdrawalsRoutes);
router.use('/disputes', disputesRoutes);
router.use('/refunds', refundsRoutes);

export default router;
