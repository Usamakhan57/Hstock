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
      default: 'ApnaStore',
    },
    storeEmail: {
      type: String,
      default: 'support@apnastore.org',
    },
    storeUrl: {
      type: String,
      default: 'https://apnastore.org',
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
    minWithdrawalAmount: {
      type: Number,
      min: 0,
      default: 10,
    },
    maxWithdrawalAmount: {
      type: Number,
      min: 0,
      default: 100000,
    },
    orderPaymentLifetimeSeconds: {
      type: Number,
      min: 300,
      max: 43200,
      default: 3600,
    },
    supportEmail: {
      type: String,
      default: 'support@apnastore.org',
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
