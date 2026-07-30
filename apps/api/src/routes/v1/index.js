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

const router = Router();

/**
 * API v1 — Phase 2 domain routes.
 * Phase 1 foundation (health, security, config bootstrap) remains intact.
 */
router.get('/', (_req, res) => {
  return sendSuccess(res, {
    message: 'HStock API v1',
    data: {
      version: 'v1',
      phase: 2,
      modules: [
        'auth',
        'users',
        'config',
        'categories',
        'brands',
        'collections',
        'tags',
        'products',
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

export default router;
