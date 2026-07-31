import mongoose from 'mongoose';
import { LEDGER_CURRENCY } from '../constants/currencies.js';

/**
 * System-level knobs (seller registration fee, etc.).
 * Defaults are seeded into MongoDB — never hardcode business values in services.
 */
const systemConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'default',
    },
    sellerRegistrationFee: {
      type: Number,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: LEDGER_CURRENCY,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);

const SystemConfig =
  mongoose.models.SystemConfig || mongoose.model('SystemConfig', systemConfigSchema);

export default SystemConfig;
