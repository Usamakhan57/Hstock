import cron from 'node-cron';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { registerEscrowJob } from './escrow.job.js';
import { registerNotificationJob } from './notification.job.js';
import { registerCleanupJob } from './cleanup.job.js';
import { registerWithdrawalJob } from './withdrawal.job.js';
import { registerOrdersJob } from './orders.job.js';
import { registerPaymentsJob } from './payments.job.js';

const jobs = [];
const scheduled = [];

/**
 * Register and optionally schedule commerce background jobs.
 * Set ENABLE_JOBS=true in production/staging to activate schedules.
 */
export function initializeJobs() {
  const registry = [
    registerEscrowJob(),
    registerOrdersJob(),
    ...registerPaymentsJob(),
    registerWithdrawalJob(),
    registerCleanupJob(),
    registerNotificationJob(),
  ];

  jobs.length = 0;
  jobs.push(...registry);

  if (!env.ENABLE_JOBS) {
    logger.info('Background jobs registered (ENABLE_JOBS=false — not scheduled)', {
      jobs: jobs.map((j) => j.name),
    });
    return jobs;
  }

  for (const job of jobs) {
    if (!job.enabled || typeof job.run !== 'function') continue;
    const schedule = job.schedule || '*/5 * * * *';
    if (!cron.validate(schedule)) {
      logger.warn(`Invalid cron schedule for job ${job.name}: ${schedule}`);
      continue;
    }

    const task = cron.schedule(schedule, async () => {
      try {
        logger.info(`Running job: ${job.name}`);
        await job.run();
      } catch (error) {
        logger.error(`Job failed: ${job.name}`, { error: error.message });
      }
    });

    scheduled.push({ name: job.name, schedule, task });
    logger.info(`Scheduled job ${job.name} (${schedule})`);
  }

  logger.info(`Background jobs active: ${scheduled.length}`);
  return jobs;
}

export function listJobs() {
  return jobs.map(({ name, enabled, schedule }) => ({ name, enabled, schedule: schedule || null }));
}

export async function runJobByName(name) {
  const job = jobs.find((j) => j.name === name);
  if (!job) {
    throw new Error(`Job not found: ${name}`);
  }
  return job.run();
}

export default {
  initializeJobs,
  listJobs,
  runJobByName,
};
