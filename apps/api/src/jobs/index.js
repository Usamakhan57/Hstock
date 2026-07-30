import cron from 'node-cron';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { registerEscrowJob } from './escrow.job.js';
import { registerNotificationJob } from './notification.job.js';
import { registerCleanupJob } from './cleanup.job.js';
import { registerWithdrawalJob } from './withdrawal.job.js';

const jobs = [];

/**
 * Registers background job scaffolds.
 * Jobs are NOT scheduled with business logic in Phase 1.
 * Set ENABLE_JOBS=true only after Phase 2 implementations exist.
 */
export function initializeJobs() {
  const registry = [
    registerEscrowJob(),
    registerNotificationJob(),
    registerCleanupJob(),
    registerWithdrawalJob(),
  ];

  jobs.push(...registry);

  if (!env.ENABLE_JOBS) {
    logger.info('Background jobs initialized in scaffold mode (ENABLE_JOBS=false)');
    return jobs;
  }

  // Placeholder schedule only — handlers remain no-op until Phase 2.
  cron.schedule('*/5 * * * *', async () => {
    logger.debug('Job tick (scaffold) — no business work executed');
  });

  logger.warn('ENABLE_JOBS=true but Phase 1 jobs are still no-op scaffolds');
  return jobs;
}

export function listJobs() {
  return jobs.map(({ name, enabled }) => ({ name, enabled }));
}

export default {
  initializeJobs,
  listJobs,
};
