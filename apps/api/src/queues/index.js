import { logger } from '../config/logger.js';

/**
 * Queue architecture placeholder.
 * Phase 2+ may introduce BullMQ/Redis or an in-process queue.
 */
export function initializeQueues() {
  logger.info('Queue layer scaffold initialized (no brokers configured in Phase 1)');
  return {
    enabled: false,
  };
}

export default {
  initializeQueues,
};
