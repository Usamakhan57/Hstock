import { EventEmitter } from 'node:events';

/** Shared domain event bus instance (no handler imports — avoids cycles). */
export const eventBus = new EventEmitter();
eventBus.setMaxListeners(100);

export function emitDomainEvent(name, payload = {}) {
  eventBus.emit(name, payload);
}

export default {
  eventBus,
  emitDomainEvent,
};
