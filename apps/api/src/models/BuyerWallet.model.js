import mongoose from 'mongoose';
import { LEDGER_CURRENCY } from '../constants/currencies.js';

/**
 * Buyer prepaid wallet (funded via Cryptomus deposit/top-up).
 * Separate from seller Wallet — never share balances.
 */
const buyerWalletSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    currency: {
      type: String,
      default: LEDGER_CURRENCY,
    },
    availableBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDeposited: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRefunded: {
      type: Number,
      default: 0,
      min: 0,
    },
    frozen: {
      type: Boolean,
      default: false,
      index: true,
    },
    frozenAt: {
      type: Date,
      default: null,
    },
    frozenReason: {
      type: String,
      default: null,
      maxlength: 500,
    },
    version: {
      type: Number,
      default: 0,
    },
    lastTransactionAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

buyerWalletSchema.index({ frozen: 1, updatedAt: -1 });

const BuyerWallet =
  mongoose.models.BuyerWallet || mongoose.model('BuyerWallet', buyerWalletSchema);

export default BuyerWallet;
