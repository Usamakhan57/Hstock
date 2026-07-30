import { Router } from 'express';
import healthRoutes from './health.routes.js';
import v1Routes from './v1/index.js';
import { env } from '../config/env.js';

const router = Router();

router.use('/health', healthRoutes);
router.use(env.API_PREFIX, v1Routes);

export default router;
