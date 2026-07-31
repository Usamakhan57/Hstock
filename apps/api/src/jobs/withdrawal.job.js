import { logger } from '../config/logger.js';
import { JobRun, Withdrawal } from '../models/index.js';
import { WITHDRAWAL_STATUS } from '../constants/statuses.js';
import { getPlatformConfig } from '../services/config.service.js';
import { addHours } from '../helpers/date.helper.js';

/**
 * SLA reminder job — flags pending withdrawals older than admin SLA hours.
 * Does NOT auto-pay. Withdrawals remain manual.
 */
export async function runWithdrawalSla() {
  const run = await JobRun.create({
    name: 'withdrawal-sla',
    status: 'running',
    startedAt: new Date(),
  });

  try {
    const platform = await getPlatformConfig();
    const hours = platform?.withdrawalAdminSlaHours || 24;
    const cutoff = addHours(new Date(), -hours);

    const overdue = await Withdrawal.find({
      status: { $in: [WITHDRAWAL_STATUS.PENDING, WITHDRAWAL_STATUS.APPROVED] },
      createdAt: { $lte: cutoff },
    })
      .select('_id requestNumber amount status createdAt')
      .limit(100)
      .lean();

    run.status = 'success';
    run.finishedAt = new Date();
    run.processed = overdue.length;
    run.succeeded = overdue.length;
    run.meta = {
      overdueCount: overdue.length,
      slaHours: hours,
      sample: overdue.slice(0, 10),
    };
    await run.save();

    if (overdue.length) {
      logger.warn('Withdrawal SLA breached', {
        count: overdue.length,
        slaHours: hours,
      });
    }

    return { processed: overdue.length, succeeded: overdue.length, failed: 0, overdue };
  } catch (error) {
    run.status = 'failed';
    run.finishedAt = new Date();
    run.error = error.message;
    await run.save();
    logger.error('Withdrawal SLA job failed', { error: error.message });
    throw error;
  }
}

export function registerWithdrawalJob() {
  return {
    name: 'withdrawal-sla',
    enabled: true,
    schedule: '0 * * * *',
    run: runWithdrawalSla,
  };
}

export default registerWithdrawalJob;
