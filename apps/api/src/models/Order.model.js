import mongoose from 'mongoose';
import { LEDGER_CURRENCY } from '../constants/currencies.js';
import {
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
  DELIVERY_STATUS,
  DELIVERY_STATUS_VALUES,
} from '../constants/statuses.js';
import { ORDER_ACCOUNT_STATUS_VALUES } from '../constants/disputeFinal.js';

const orderAccountSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true, min: 0 },
    identifier: { type: String, default: null, trim: true, maxlength: 200 },
    status: {
      type: String,
      enum: ORDER_ACCOUNT_STATUS_VALUES,
      default: 'active',
    },
    label: { type: String, default: null, maxlength: 200 },
  },
  { _id: true },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
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
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    productSnapshot: {
      title: { type: String, required: true },
      slug: { type: String, default: null },
      price: { type: Number, required: true },
      currency: { type: String, default: LEDGER_CURRENCY },
      productType: { type: String, default: null },
      thumbnail: { type: String, default: null },
      deliveryType: { type: String, default: null },
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
      max: 500,
    },
    /**
     * Line items for multi-account digital orders.
     * Enables partial disputes against specific accounts.
     */
    accounts: {
      type: [orderAccountSchema],
      default: [],
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
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
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: LEDGER_CURRENCY,
      index: true,
    },
    status: {
      type: String,
      enum: ORDER_STATUS_VALUES,
      default: ORDER_STATUS.PENDING_PAYMENT,
      index: true,
    },
    deliveryStatus: {
      type: String,
      enum: DELIVERY_STATUS_VALUES,
      default: DELIVERY_STATUS.PENDING,
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
    refund: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Refund',
      default: null,
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
    escrowedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledReason: {
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

orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });
orderSchema.index({ buyer: 1, status: 1, createdAt: -1 });
orderSchema.index({ seller: 1, status: 1, createdAt: -1 });
orderSchema.index({ status: 1, expiresAt: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
