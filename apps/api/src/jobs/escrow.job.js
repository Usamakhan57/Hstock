import { logger } from '../config/logger.js';
import { JobRun } from '../models/index.js';
import * as escrowService from '../services/escrow.service.js';

/**
 * 24-hour escrow auto-release.
 * Releases locked escrow to seller wallet only when no dispute exists.
 */
export async function runEscrowAutoRelease() {
  const run = await JobRun.create({
    name: 'escrow-auto-release',
    status: 'running',
    startedAt: new Date(),
  });

  try {
    const results = await escrowService.processDueEscrowReleases({ limit: 100 });
    run.status = 'success';
    run.finishedAt = new Date();
    run.processed = results.processed;
    run.succeeded = results.succeeded;
    run.failed = results.failed;
    run.meta = { errors: results.errors?.slice(0, 20) || [] };
    await run.save();
    logger.info('Escrow auto-release job completed', results);
    return results;
  } catch (error) {
    run.status = 'failed';
    run.finishedAt = new Date();
    run.error = error.message;
    await run.save();
    logger.error('Escrow auto-release job failed', { error: error.message });
    throw error;
  }
}

export function registerEscrowJob() {
  return {
    name: 'escrow-auto-release',
    enabled: true,
    schedule: '*/5 * * * *',
    run: runEscrowAutoRelease,
  };
}

export default registerEscrowJob;
