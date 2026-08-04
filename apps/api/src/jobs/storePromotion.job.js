import { logger } from '../config/logger.js';
import { JobRun } from '../models/index.js';
import * as storePromotionService from '../services/storePromotion.service.js';

/**
 * Auto-expire store promotions after duration (default 72h).
 * Removes badges / priority via SellerProfile denorm flags.
 */
export async function runExpireStorePromotions() {
  const run = await JobRun.create({
    name: 'expire-store-promotions',
    status: 'running',
    startedAt: new Date(),
  });

  try {
    const results = await storePromotionService.expireDuePromotions({ limit: 100 });
    run.status = 'success';
    run.finishedAt = new Date();
    run.processed = results.processed;
    run.succeeded = results.succeeded;
    run.failed = results.failed;
    run.meta = {
      errors: results.errors?.slice(0, 20) || [],
      staleCleared: results.staleCleared || 0,
    };
    await run.save();
    logger.info('Expire store promotions job completed', results);
    return results;
  } catch (error) {
    run.status = 'failed';
    run.finishedAt = new Date();
    run.error = error.message;
    await run.save();
    logger.error('Expire store promotions job failed', { error: error.message });
    throw error;
  }
}

export function registerStorePromotionJob() {
  return {
    name: 'expire-store-promotions',
    enabled: true,
    schedule: '*/5 * * * *',
    run: runExpireStorePromotions,
  };
}

export default registerStorePromotionJob;
