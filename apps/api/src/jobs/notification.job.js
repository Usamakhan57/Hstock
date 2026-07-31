import { logger } from '../config/logger.js';
import { getQueue } from '../queues/index.js';

/**
 * Periodic drain/health check for the notifications queue.
 */
export function registerNotificationJob() {
  return {
    name: 'notification-dispatch',
    enabled: true,
    schedule: '*/2 * * * *',
    run: async () => {
      const queue = getQueue('notifications');
      const size = queue?.size?.() ?? 0;
      if (size > 0) {
        logger.info('Notifications queue backlog', { size });
        await queue.drain();
      }
    },
  };
}

export default registerNotificationJob;
