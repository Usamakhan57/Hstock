import mongoose from 'mongoose';
import { LEDGER_CURRENCY } from '../constants/currencies.js';
import {
  ESCROW_STATUS,
  ESCROW_STATUS_VALUES,
} from '../constants/statuses.js';

const escrowSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    seller: {
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    sellerAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: LEDGER_CURRENCY,
    },
    status: {
      type: String,
      enum: ESCROW_STATUS_VALUES,
      default: ESCROW_STATUS.PENDING,
      index: true,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
    /** When auto-release becomes eligible (lockedAt + platform hours) */
    releaseAt: {
      type: Date,
      default: null,
      index: true,
    },
    releasedAt: {
      type: Date,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    disputedAt: {
      type: Date,
      default: null,
    },
    dispute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispute',
      default: null,
      index: true,
    },
    releaseJobProcessedAt: {
      type: Date,
      default: null,
    },
    releaseReason: {
      type: String,
      default: null,
      maxlength: 500,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

escrowSchema.index({ status: 1, releaseAt: 1 });
escrowSchema.index({ seller: 1, status: 1 });

const Escrow = mongoose.models.Escrow || mongoose.model('Escrow', escrowSchema);

export default Escrow;
