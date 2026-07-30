import { logger } from '../config/logger.js';

/**
 * Withdrawal SLA / reminder job scaffold.
 * Phase 2+ may remind admins of Pending withdrawals nearing 24h SLA.
 * Admin still completes payouts manually — no auto-transfer here.
 */
export function registerWithdrawalJob() {
  logger.info('Withdrawal job scaffold registered (disabled — no business logic in Phase 1)');
  return {
    name: 'withdrawal-sla',
    enabled: false,
    run: async () => {
      logger.debug('Withdrawal job noop — reserved for Phase 2+');
    },
  };
}

export default registerWithdrawalJob;
