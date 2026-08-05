import { logger } from '../config/logger.js';
import { JobRun } from '../models/index.js';
import * as disputeService from '../services/dispute.service.js';

/**
 * Auto-refund open disputes where:
 * - seller never submitted a replacement within 24h, OR
 * - buyer rejected all replacement attempts (maximum_replacements_reached) and the final 24h timer elapsed.
 */
export async function runDisputeAutoRefund() {
  const run = await JobRun.create({
    name: 'dispute-auto-refund',
    status: 'running',
    startedAt: new Date(),
  });

  try {
    const results = await disputeService.processUnansweredDisputeAutoRefunds({ limit: 50 });
    run.status = 'success';
    run.finishedAt = new Date();
    run.processed = results.processed;
    run.succeeded = results.succeeded;
    run.failed = results.failed;
    run.meta = { errors: results.errors?.slice(0, 20) || [] };
    await run.save();
    logger.info('Dispute auto-refund job completed', results);
    return results;
  } catch (error) {
    run.status = 'failed';
    run.finishedAt = new Date();
    run.error = error.message;
    await run.save();
    logger.error('Dispute auto-refund job failed', { error: error.message });
    throw error;
  }
}

export function registerDisputeAutoRefundJob() {
  return {
    name: 'dispute-auto-refund',
    enabled: true,
    schedule: '*/5 * * * *',
    run: runDisputeAutoRefund,
  };
}

export default registerDisputeAutoRefundJob;
