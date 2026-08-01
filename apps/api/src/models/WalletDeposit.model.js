import mongoose from 'mongoose';
import { LEDGER_CURRENCY } from '../constants/currencies.js';
import {
  PAYMENT_STATUS,
  PAYMENT_STATUS_VALUES,
} from '../constants/statuses.js';

/**
 * Cryptomus invoice that funds a buyer wallet (deposit or top-up).
 * Kept separate from order Payment documents.
 */
const walletDepositSchema = new mongoose.Schema(
  {
    depositNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    buyerWallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BuyerWallet',
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['deposit', 'topup'],
      default: 'deposit',
      index: true,
    },
    gateway: {
      type: String,
      enum: ['cryptomus'],
      default: 'cryptomus',
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
    toCurrency: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
    },
    network: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: PAYMENT_STATUS_VALUES,
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    cryptomusUuid: {
      type: String,
      default: null,
      sparse: true,
      unique: true,
      index: true,
    },
    cryptomusOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invoiceUrl: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
    txid: {
      type: String,
      default: null,
      index: true,
    },
    providerStatus: {
      type: String,
      default: null,
    },
    isFinal: {
      type: Boolean,
      default: false,
    },
    lifetimeSeconds: {
      type: Number,
      default: 3600,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    creditedAt: {
      type: Date,
      default: null,
    },
    creditTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BuyerWalletTransaction',
      default: null,
    },
    lastWebhookAt: {
      type: Date,
      default: null,
    },
    webhookCount: {
      type: Number,
      default: 0,
    },
    rawInvoice: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    rawLastWebhook: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
      maxlength: 2000,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

walletDepositSchema.index({ buyer: 1, createdAt: -1 });
walletDepositSchema.index({ status: 1, createdAt: -1 });

const WalletDeposit =
  mongoose.models.WalletDeposit || mongoose.model('WalletDeposit', walletDepositSchema);

export default WalletDeposit;
