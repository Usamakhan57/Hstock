import mongoose from 'mongoose';
import { LEDGER_CURRENCY } from '../constants/currencies.js';

export const BUYER_WALLET_TX_TYPE = Object.freeze({
  DEPOSIT: 'deposit',
  TOPUP: 'topup',
  WITHDRAWAL: 'withdrawal',
  PURCHASE: 'purchase',
  REFUND: 'refund',
  ADJUSTMENT: 'adjustment',
  BONUS: 'bonus',
  COMMISSION: 'commission',
});

export const BUYER_WALLET_TX_TYPE_VALUES = Object.freeze(Object.values(BUYER_WALLET_TX_TYPE));

export const BUYER_WALLET_TX_STATUS = Object.freeze({
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
});

export const BUYER_WALLET_TX_STATUS_VALUES = Object.freeze(Object.values(BUYER_WALLET_TX_STATUS));

const buyerWalletTransactionSchema = new mongoose.Schema(
  {
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
    type: {
      type: String,
      enum: BUYER_WALLET_TX_TYPE_VALUES,
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ['credit', 'debit'],
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
    status: {
      type: String,
      enum: BUYER_WALLET_TX_STATUS_VALUES,
      default: BUYER_WALLET_TX_STATUS.COMPLETED,
      index: true,
    },
    balanceAfter: {
      type: Number,
      default: null,
    },
    pendingAfter: {
      type: Number,
      default: null,
    },
    reference: {
      type: String,
      default: null,
      index: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    deposit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WalletDeposit',
      default: null,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    refund: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Refund',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

buyerWalletTransactionSchema.index({ buyer: 1, createdAt: -1 });
buyerWalletTransactionSchema.index({ type: 1, createdAt: -1 });
buyerWalletTransactionSchema.index({ status: 1, createdAt: -1 });

const BuyerWalletTransaction =
  mongoose.models.BuyerWalletTransaction
  || mongoose.model('BuyerWalletTransaction', buyerWalletTransactionSchema);

export default BuyerWalletTransaction;
