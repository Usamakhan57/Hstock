import { logger } from '../config/logger.js';

/**
 * Notification job scaffold.
 * Phase 2+ will process queued notifications / emails.
 */
export function registerNotificationJob() {
  logger.info('Notification job scaffold registered (disabled — no business logic in Phase 1)');
  return {
    name: 'notification-dispatch',
    enabled: false,
    run: async () => {
      logger.debug('Notification job noop — reserved for Phase 2+');
    },
  };
}

export default registerNotificationJob;
