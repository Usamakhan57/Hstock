import { EventEmitter } from 'node:events';
import { logger } from '../config/logger.js';

/**
 * In-process domain event bus scaffold.
 * Phase 2+ will emit order.paid, escrow.released, withdrawal.pending, etc.
 */
export const eventBus = new EventEmitter();
eventBus.setMaxListeners(50);

export function initializeEvents() {
  eventBus.on('error', (error) => {
    logger.error('Event bus error', { message: error.message });
  });

  logger.info('Event bus scaffold initialized');
  return eventBus;
}

export default {
  eventBus,
  initializeEvents,
};
