import mongoose from 'mongoose';
import { LEDGER_CURRENCY } from '../constants/currencies.js';
import {
  REFUND_STATUS,
  REFUND_STATUS_VALUES,
  REFUND_TYPE,
  REFUND_TYPE_VALUES,
} from '../constants/statuses.js';

const refundSchema = new mongoose.Schema(
  {
    refundNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
      index: true,
    },
    escrow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Escrow',
      default: null,
      index: true,
    },
    dispute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispute',
      default: null,
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
    type: {
      type: String,
      enum: REFUND_TYPE_VALUES,
      default: REFUND_TYPE.FULL,
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
    status: {
      type: String,
      enum: REFUND_STATUS_VALUES,
      default: REFUND_STATUS.PENDING,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    adminNote: {
      type: String,
      default: null,
      maxlength: 2000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

refundSchema.index({ status: 1, createdAt: -1 });

const Refund = mongoose.models.Refund || mongoose.model('Refund', refundSchema);

export default Refund;
