import { logger } from '../config/logger.js';
import { eventBus, emitDomainEvent } from './bus.js';
import { registerEventHandlers } from './handlers.js';

export { eventBus, emitDomainEvent };

let initialized = false;

export function initializeEvents() {
  if (initialized) return eventBus;
  initialized = true;

  eventBus.on('error', (error) => {
    logger.error('Event bus error', { message: error.message });
  });

  registerEventHandlers(eventBus);
  logger.info('Event bus initialized');
  return eventBus;
}

export default {
  eventBus,
  initializeEvents,
  emitDomainEvent,
};
