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
    /** Paid store promotion system */
    storePromotionEnabled: {
      type: Boolean,
      default: true,
    },
    storePromotionPriceUsd: {
      type: Number,
      min: 0,
      default: 10,
    },
    storePromotionDurationHours: {
      type: Number,
      min: 1,
      max: 8760,
      default: 72,
    },
    /** Permanent seller verification (wallet fee) */
    sellerVerificationEnabled: {
      type: Boolean,
      default: true,
    },
    sellerVerificationFeeUsd: {
      type: Number,
      min: 0,
      default: 10,
    },
    allowManualSellerVerification: {
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

const PlatformConfig =
  mongoose.models.PlatformConfig || mongoose.model('PlatformConfig', platformConfigSchema);

export default PlatformConfig;
