import { SystemConfig, PlatformConfig, CommissionConfig } from '../models/index.js';
import { LEDGER_CURRENCY } from '../constants/currencies.js';
import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../utils/transaction.js';

/** Seed defaults — values live in MongoDB after first ensure. */
const SYSTEM_DEFAULTS = Object.freeze({
  key: 'default',
  sellerRegistrationFee: 0,
  currency: LEDGER_CURRENCY,
  isEnabled: true,
});

const PLATFORM_DEFAULTS = Object.freeze({
  key: 'default',
  storeName: 'ApnaStore',
  storeEmail: 'support@apnastore.org',
  storeUrl: 'https://apnastore.org',
  maintenanceMode: false,
  escrowAutoReleaseHours: 24,
  withdrawalAdminSlaHours: 24,
  minWithdrawalAmount: 10,
  maxWithdrawalAmount: 100000,
  orderPaymentLifetimeSeconds: 3600,
  supportEmail: 'support@apnastore.org',
});

const COMMISSION_DEFAULTS = Object.freeze({
  key: 'default',
  isActive: true,
  defaultPercent: 10,
  categoryRules: [],
  sellerRules: [],
});

export async function ensureDefaultConfigs(session = null) {
  const opts = session ? { session } : {};

  const [system, platform, commission] = await Promise.all([
    SystemConfig.findOneAndUpdate(
      { key: 'default' },
      { $setOnInsert: SYSTEM_DEFAULTS },
      { upsert: true, new: true, ...opts },
    ),
    PlatformConfig.findOneAndUpdate(
      { key: 'default' },
      { $setOnInsert: PLATFORM_DEFAULTS },
      { upsert: true, new: true, ...opts },
    ),
    CommissionConfig.findOneAndUpdate(
      { key: 'default' },
      { $setOnInsert: COMMISSION_DEFAULTS },
      { upsert: true, new: true, ...opts },
    ),
  ]);

  return { system, platform, commission };
}

export async function getSystemConfig() {
  await ensureDefaultConfigs();
  return SystemConfig.findOne({ key: 'default' }).lean();
}

export async function getPlatformConfig() {
  await ensureDefaultConfigs();
  return PlatformConfig.findOne({ key: 'default' }).lean();
}

export async function getCommissionConfig() {
  await ensureDefaultConfigs();
  return CommissionConfig.findOne({ key: 'default' }).lean();
}

export async function getAllConfigs() {
  const { system, platform, commission } = await ensureDefaultConfigs();
  return {
    systemConfig: system.toObject(),
    platformConfig: platform.toObject(),
    commissionConfig: commission.toObject(),
  };
}

export async function updateSystemConfig(payload, userId) {
  await ensureDefaultConfigs();
  const updated = await SystemConfig.findOneAndUpdate(
    { key: 'default' },
    {
      $set: {
        ...payload,
        updatedBy: userId || null,
      },
    },
    { new: true },
  ).lean();

  if (!updated) {
    throw new AppError('SystemConfig not found', 404, { code: 'CONFIG_NOT_FOUND' });
  }
  return updated;
}

export async function updatePlatformConfig(payload, userId) {
  await ensureDefaultConfigs();
  const updated = await PlatformConfig.findOneAndUpdate(
    { key: 'default' },
    {
      $set: {
        ...payload,
        updatedBy: userId || null,
      },
    },
    { new: true },
  ).lean();

  if (!updated) {
    throw new AppError('PlatformConfig not found', 404, { code: 'CONFIG_NOT_FOUND' });
  }
  return updated;
}

export async function updateCommissionConfig(payload, userId) {
  await ensureDefaultConfigs();
  const updated = await CommissionConfig.findOneAndUpdate(
    { key: 'default' },
    {
      $set: {
        ...payload,
        updatedBy: userId || null,
      },
    },
    { new: true },
  ).lean();

  if (!updated) {
    throw new AppError('CommissionConfig not found', 404, { code: 'CONFIG_NOT_FOUND' });
  }
  return updated;
}

/**
 * Read seller registration fee from MongoDB (never hardcoded).
 */
export async function getSellerRegistrationFee() {
  const config = await getSystemConfig();
  return {
    sellerRegistrationFee: config.sellerRegistrationFee,
    currency: config.currency,
    isEnabled: config.isEnabled,
  };
}

export async function seedConfigsWithTransaction() {
  return withTransaction((session) => ensureDefaultConfigs(session));
}

export default {
  ensureDefaultConfigs,
  getSystemConfig,
  getPlatformConfig,
  getCommissionConfig,
  getAllConfigs,
  updateSystemConfig,
  updatePlatformConfig,
  updateCommissionConfig,
  getSellerRegistrationFee,
  seedConfigsWithTransaction,
};
