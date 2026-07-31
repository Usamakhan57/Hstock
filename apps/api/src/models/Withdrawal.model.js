import mongoose from 'mongoose';
import { LEDGER_CURRENCY } from '../constants/currencies.js';
import { SUPPORTED_COINS, CRYPTOMUS_NETWORKS } from '../constants/coins.js';
import {
  WITHDRAWAL_STATUS,
  WITHDRAWAL_STATUS_VALUES,
} from '../constants/statuses.js';

const withdrawalSchema = new mongoose.Schema(
  {
    requestNumber: {
      type: String,
      required: true,
      unique: true,
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
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
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
    coin: {
      type: String,
      enum: SUPPORTED_COINS,
      required: true,
      index: true,
    },
    network: {
      type: String,
      enum: CRYPTOMUS_NETWORKS,
      required: true,
      index: true,
    },
    walletAddress: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: WITHDRAWAL_STATUS_VALUES,
      default: WITHDRAWAL_STATUS.PENDING,
      index: true,
    },
    adminNote: {
      type: String,
      default: null,
      maxlength: 2000,
    },
    rejectionReason: {
      type: String,
      default: null,
      maxlength: 2000,
    },
    payoutReference: {
      type: String,
      default: null,
      trim: true,
    },
    payoutTxid: {
      type: String,
      default: null,
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
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

withdrawalSchema.index({ seller: 1, status: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });

const Withdrawal =
  mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema);

export default Withdrawal;
