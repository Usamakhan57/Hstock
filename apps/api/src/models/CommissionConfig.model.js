import mongoose from 'mongoose';

/**
 * Commission rules stored in MongoDB — never hardcoded in business logic.
 * Default product commission is seeded as 10%.
 * Calculation of commissions is deferred to a later phase.
 */
const commissionRuleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerProfile', default: null },
    percent: { type: Number, min: 0, max: 100, required: true },
    priority: { type: Number, default: 0 },
  },
  { _id: false },
);

const commissionConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'default',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    defaultPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 10,
    },
    categoryRules: {
      type: [commissionRuleSchema],
      default: [],
    },
    sellerRules: {
      type: [commissionRuleSchema],
      default: [],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);

const CommissionConfig =
  mongoose.models.CommissionConfig
  || mongoose.model('CommissionConfig', commissionConfigSchema);

export default CommissionConfig;
