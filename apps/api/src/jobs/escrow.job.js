import { logger } from '../config/logger.js';

/**
 * Escrow auto-release job scaffold.
 * Phase 2+ will release Held escrow after 24h when no dispute exists.
 * Do NOT implement escrow business logic in Phase 1.
 */
export function registerEscrowJob() {
  logger.info('Escrow job scaffold registered (disabled — no business logic in Phase 1)');
  return {
    name: 'escrow-auto-release',
    enabled: false,
    run: async () => {
      logger.debug('Escrow job noop — reserved for Phase 2+');
    },
  };
}

export default registerEscrowJob;
