import { logger } from '../config/logger.js';
import { JobRun, WebhookEvent, RefreshToken } from '../models/index.js';

/**
 * Cleanup stale webhook events and expired refresh tokens.
 */
export async function runCleanup() {
  const run = await JobRun.create({
    name: 'cleanup',
    status: 'running',
    startedAt: new Date(),
  });

  try {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [webhooks, tokens] = await Promise.all([
      WebhookEvent.deleteMany({
        status: 'processed',
        createdAt: { $lt: cutoff },
      }),
      RefreshToken.deleteMany({
        $or: [
          { expiresAt: { $lt: new Date() } },
          { revokedAt: { $ne: null, $lt: cutoff } },
        ],
      }),
    ]);

    const results = {
      processed: (webhooks.deletedCount || 0) + (tokens.deletedCount || 0),
      succeeded: (webhooks.deletedCount || 0) + (tokens.deletedCount || 0),
      failed: 0,
      webhooksDeleted: webhooks.deletedCount || 0,
      tokensDeleted: tokens.deletedCount || 0,
    };

    run.status = 'success';
    run.finishedAt = new Date();
    run.processed = results.processed;
    run.succeeded = results.succeeded;
    run.meta = results;
    await run.save();
    logger.info('Cleanup job completed', results);
    return results;
  } catch (error) {
    run.status = 'failed';
    run.finishedAt = new Date();
    run.error = error.message;
    await run.save();
    logger.error('Cleanup job failed', { error: error.message });
    throw error;
  }
}

export function registerCleanupJob() {
  return {
    name: 'cleanup',
    enabled: true,
    schedule: '0 */6 * * *',
    run: runCleanup,
  };
}

export default registerCleanupJob;
