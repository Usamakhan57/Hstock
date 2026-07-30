import { Router } from 'express';
import { sendSuccess } from '../../utils/response.js';

const router = Router();

/**
 * API v1 root — domain routes will be mounted here in Phase 2+.
 * Phase 1 intentionally exposes no business endpoints.
 */
router.get('/', (_req, res) => {
  return sendSuccess(res, {
    message: 'HStock API v1',
    data: {
      version: 'v1',
      phase: 1,
      note: 'Foundation only. Business routes will be added in later phases.',
      health: '/health',
    },
  });
});

export default router;
