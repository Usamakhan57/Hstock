import { EventEmitter } from 'node:events';
import { logger } from '../config/logger.js';

/**
 * Lightweight in-process queue for deferred commerce work.
 * Production can swap this for BullMQ/Redis without changing service contracts.
 */
class MemoryQueue extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
    this.pending = [];
    this.processing = false;
    this.handlers = [];
  }

  add(payload) {
    this.pending.push({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      payload,
      enqueuedAt: new Date(),
      attempts: 0,
    });
    this.emit('enqueued', payload);
    void this.drain();
    return this.pending.length;
  }

  process(handler) {
    this.handlers.push(handler);
  }

  async drain() {
    if (this.processing) return;
    this.processing = true;
    try {
      while (this.pending.length) {
        const job = this.pending.shift();
        for (const handler of this.handlers) {
          try {
            await handler(job);
          } catch (error) {
            job.attempts += 1;
            logger.error(`Queue ${this.name} handler failed`, {
              error: error.message,
              jobId: job.id,
              attempts: job.attempts,
            });
            if (job.attempts < 3) {
              this.pending.push(job);
            }
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }

  size() {
    return this.pending.length;
  }
}

const queues = {
  webhooks: new MemoryQueue('webhooks'),
  payments: new MemoryQueue('payments'),
  escrow: new MemoryQueue('escrow'),
  notifications: new MemoryQueue('notifications'),
  telegram: new MemoryQueue('telegram'),
};

export function getQueue(name) {
  return queues[name] || null;
}

export function enqueue(name, payload) {
  const queue = getQueue(name);
  if (!queue) {
    throw new Error(`Unknown queue: ${name}`);
  }
  return queue.add(payload);
}

export function initializeQueues() {
  queues.webhooks.process(async (job) => {
    logger.debug('Webhook queue item', { id: job.id });
  });
  queues.payments.process(async (job) => {
    logger.debug('Payments queue item', { id: job.id });
  });
  queues.escrow.process(async (job) => {
    logger.debug('Escrow queue item', { id: job.id });
  });
  queues.notifications.process(async (job) => {
    const { processNotificationJob } = await import('../services/notification.service.js');
    await processNotificationJob(job);
  });
  queues.telegram.process(async (job) => {
    const { processTelegramJob } = await import('../services/telegram.service.js');
    await processTelegramJob(job);
  });

  logger.info('In-process commerce queues initialized', {
    queues: Object.keys(queues),
  });

  return {
    enabled: true,
    queues: Object.keys(queues),
  };
}

export default {
  initializeQueues,
  getQueue,
  enqueue,
};
