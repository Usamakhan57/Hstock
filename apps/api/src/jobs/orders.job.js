import { logger } from '../config/logger.js';
import { JobRun } from '../models/index.js';
import * as orderService from '../services/order.service.js';

/**
 * Expire unpaid orders past their payment window and restock products.
 */
export async function runExpireOrders() {
  const run = await JobRun.create({
    name: 'expire-orders',
    status: 'running',
    startedAt: new Date(),
  });

  try {
    const results = await orderService.expireOrders({ limit: 100 });
    run.status = 'success';
    run.finishedAt = new Date();
    run.processed = results.processed;
    run.succeeded = results.succeeded;
    run.failed = results.failed;
    await run.save();
    logger.info('Expire-orders job completed', results);
    return results;
  } catch (error) {
    run.status = 'failed';
    run.finishedAt = new Date();
    run.error = error.message;
    await run.save();
    logger.error('Expire-orders job failed', { error: error.message });
    throw error;
  }
}

export function registerOrdersJob() {
  return {
    name: 'expire-orders',
    enabled: true,
    schedule: '*/5 * * * *',
    run: runExpireOrders,
  };
}

export default registerOrdersJob;
