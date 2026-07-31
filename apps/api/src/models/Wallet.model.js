import mongoose from 'mongoose';
import { LEDGER_CURRENCY } from '../constants/currencies.js';

/**
 * Seller internal wallet.
 * Balances are stored in ledger currency (USD).
 * All mutations go through wallet.service with ledger entries.
 */
const walletSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
      unique: true,
      index: true,
    },
    sellerUser: {
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
    /** Funds available for withdrawal */
    availableBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Funds currently locked in escrow (awaiting auto-release) */
    pendingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Lifetime total released from escrow into the wallet */
    releasedBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Available minus reserved pending withdrawals */
    withdrawableBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Amount reserved by pending/approved withdrawal requests */
    reservedBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Lifetime withdrawn (status = paid) */
    totalWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Lifetime commission deducted on releases */
    totalCommissionPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    version: {
      type: Number,
      default: 0,
    },
    lastTransactionAt: {
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

walletSchema.index({ availableBalance: -1 });

const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', walletSchema);

export default Wallet;
