import mongoose from 'mongoose';
import { LEDGER_CURRENCY } from '../constants/currencies.js';
import {
  LEDGER_ACCOUNT_VALUES,
  LEDGER_ENTRY_TYPE_VALUES,
  LEDGER_DIRECTION_VALUES,
} from '../constants/ledger.js';

/**
 * Immutable double-entry ledger line.
 * Each financial action creates at least one debit and one credit with the same transferId.
 */
const ledgerEntrySchema = new mongoose.Schema(
  {
    transferId: {
      type: String,
      required: true,
      index: true,
    },
    entryType: {
      type: String,
      enum: LEDGER_ENTRY_TYPE_VALUES,
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: LEDGER_DIRECTION_VALUES,
      required: true,
      index: true,
    },
    account: {
      type: String,
      enum: LEDGER_ACCOUNT_VALUES,
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
    balanceAfter: {
      type: Number,
      default: null,
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
      index: true,
    },
    escrow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Escrow',
      default: null,
      index: true,
    },
    withdrawal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Withdrawal',
      default: null,
      index: true,
    },
    refund: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Refund',
      default: null,
      index: true,
    },
    dispute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispute',
      default: null,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      default: null,
      index: true,
    },
    sellerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      default: null,
      index: true,
    },
    buyerWallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BuyerWallet',
      default: null,
      index: true,
    },
    deposit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WalletDeposit',
      default: null,
      index: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: 1000,
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
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

ledgerEntrySchema.index({ transferId: 1, direction: 1, account: 1 });
ledgerEntrySchema.index({ createdAt: -1 });
ledgerEntrySchema.index({ seller: 1, createdAt: -1 });

const LedgerEntry =
  mongoose.models.LedgerEntry || mongoose.model('LedgerEntry', ledgerEntrySchema);

export default LedgerEntry;
