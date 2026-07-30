import { logger } from '../config/logger.js';

/**
 * Cleanup job scaffold.
 * Phase 2+ will purge temp uploads, expired sessions, stale invoices, etc.
 */
export function registerCleanupJob() {
  logger.info('Cleanup job scaffold registered (disabled — no business logic in Phase 1)');
  return {
    name: 'cleanup',
    enabled: false,
    run: async () => {
      logger.debug('Cleanup job noop — reserved for Phase 2+');
    },
  };
}

export default registerCleanupJob;
