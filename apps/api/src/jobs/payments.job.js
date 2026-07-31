import { logger } from '../config/logger.js';
import { JobRun } from '../models/index.js';
import * as paymentService from '../services/payment.service.js';

/**
 * Retry failed / in-flight payment status syncs with Cryptomus.
 */
export async function runRetryFailedPayments() {
  const run = await JobRun.create({
    name: 'retry-failed-payments',
    status: 'running',
    startedAt: new Date(),
  });

  try {
    const results = await paymentService.retryFailedPayments({ limit: 50 });
    run.status = 'success';
    run.finishedAt = new Date();
    run.processed = results.processed;
    run.succeeded = results.succeeded;
    run.failed = results.failed;
    await run.save();
    logger.info('Retry-failed-payments job completed', results);
    return results;
  } catch (error) {
    run.status = 'failed';
    run.finishedAt = new Date();
    run.error = error.message;
    await run.save();
    logger.error('Retry-failed-payments job failed', { error: error.message });
    throw error;
  }
}

/**
 * Re-process failed webhook events.
 */
export async function runRetryFailedWebhooks() {
  const run = await JobRun.create({
    name: 'retry-failed-webhooks',
    status: 'running',
    startedAt: new Date(),
  });

  try {
    const results = await paymentService.retryFailedWebhooks({ limit: 50 });
    run.status = 'success';
    run.finishedAt = new Date();
    run.processed = results.processed;
    run.succeeded = results.succeeded;
    run.failed = results.failed;
    await run.save();
    logger.info('Retry-failed-webhooks job completed', results);
    return results;
  } catch (error) {
    run.status = 'failed';
    run.finishedAt = new Date();
    run.error = error.message;
    await run.save();
    logger.error('Retry-failed-webhooks job failed', { error: error.message });
    throw error;
  }
}

export function registerPaymentsJob() {
  return [
    {
      name: 'retry-failed-payments',
      enabled: true,
      schedule: '*/10 * * * *',
      run: runRetryFailedPayments,
    },
    {
      name: 'retry-failed-webhooks',
      enabled: true,
      schedule: '*/10 * * * *',
      run: runRetryFailedWebhooks,
    },
  ];
}

export default registerPaymentsJob;
