import mongoose from 'mongoose';

/**
 * Platform-wide settings editable later from Admin Dashboard.
 */
const platformConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'default',
    },
    storeName: {
      type: String,
      default: 'HStock',
    },
    storeEmail: {
      type: String,
      default: 'support@hstock.store',
    },
    storeUrl: {
      type: String,
      default: 'https://hstock.store',
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
      index: true,
    },
    escrowAutoReleaseHours: {
      type: Number,
      min: 1,
      default: 24,
    },
    withdrawalAdminSlaHours: {
      type: Number,
      min: 1,
      default: 24,
    },
    supportEmail: {
      type: String,
      default: 'support@hstock.store',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);

const PlatformConfig =
  mongoose.models.PlatformConfig || mongoose.model('PlatformConfig', platformConfigSchema);

export default PlatformConfig;
