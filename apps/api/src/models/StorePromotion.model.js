import mongoose from 'mongoose';
import {
  STORE_PROMOTION_STATUS,
  STORE_PROMOTION_STATUS_VALUES,
} from '../constants/storePromotion.js';
import { LEDGER_CURRENCY } from '../constants/currencies.js';

/**
 * Paid store promotion purchased from seller wallet.
 * While status=active and expiresAt > now, seller gets featured ranking + badges.
 */
const storePromotionSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
      index: true,
    },
    sellerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: STORE_PROMOTION_STATUS_VALUES,
      default: STORE_PROMOTION_STATUS.ACTIVE,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: LEDGER_CURRENCY,
    },
    durationHours: {
      type: Number,
      required: true,
      min: 1,
      default: 72,
    },
    startsAt: {
      type: Date,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    /** Ledger transfer id / wallet payment reference */
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelReason: {
      type: String,
      default: null,
      maxlength: 500,
    },
    /** Analytics counters */
    analytics: {
      views: { type: Number, default: 0, min: 0 },
      clicks: { type: Number, default: 0, min: 0 },
      ordersGenerated: { type: Number, default: 0, min: 0 },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

storePromotionSchema.index({ sellerId: 1, status: 1, expiresAt: -1 });
storePromotionSchema.index({ status: 1, expiresAt: 1 });
storePromotionSchema.index({ createdAt: -1 });

const StorePromotion =
  mongoose.models.StorePromotion || mongoose.model('StorePromotion', storePromotionSchema);

export default StorePromotion;
