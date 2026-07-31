import mongoose from 'mongoose';
import { LEDGER_CURRENCY } from '../constants/currencies.js';
import {
  PAYMENT_STATUS,
  PAYMENT_STATUS_VALUES,
} from '../constants/statuses.js';

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true,
    },
    orderNumber: {
      type: String,
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
    gateway: {
      type: String,
      enum: ['cryptomus'],
      default: 'cryptomus',
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
    /** Preferred crypto asset / network selected by buyer (optional) */
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
    payerAmount: {
      type: String,
      default: null,
    },
    payerCurrency: {
      type: String,
      default: null,
    },
    merchantAmount: {
      type: String,
      default: null,
    },
    paymentAmount: {
      type: String,
      default: null,
    },
    paymentAmountUsd: {
      type: Number,
      default: null,
    },
    providerStatus: {
      type: String,
      default: null,
      index: true,
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
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    lastSyncedAt: {
      type: Date,
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

paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ buyer: 1, createdAt: -1 });

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;
