import mongoose from 'mongoose';
import {
  DISPUTE_STATUS,
  DISPUTE_STATUS_VALUES,
  DISPUTE_RESOLUTION,
  DISPUTE_RESOLUTION_VALUES,
} from '../constants/statuses.js';

const disputeMessageSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['buyer', 'seller', 'admin', 'support', 'system'],
      required: true,
    },
    body: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    attachments: [
      {
        type: String,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const disputeSchema = new mongoose.Schema(
  {
    disputeNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true,
    },
    escrow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Escrow',
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
    reason: {
      type: String,
      required: true,
      maxlength: 500,
    },
    description: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    evidence: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: DISPUTE_STATUS_VALUES,
      default: DISPUTE_STATUS.OPEN,
      index: true,
    },
    resolution: {
      type: String,
      enum: DISPUTE_RESOLUTION_VALUES,
      default: undefined,
    },
    resolutionNote: {
      type: String,
      default: null,
      maxlength: 5000,
    },
    refundAmount: {
      type: Number,
      default: null,
      min: 0,
    },

    // ---- Partial dispute quantities / amounts ----
    orderQuantity: { type: Number, required: true, min: 1 },
    disputedQuantity: { type: Number, required: true, min: 1 },
    resolvedQuantity: { type: Number, default: 0, min: 0 },
    replacementQuantity: { type: Number, default: 0, min: 0 },
    refundQuantity: { type: Number, default: 0, min: 0 },
    releasedQuantity: { type: Number, default: 0, min: 0 },
    heldQuantity: { type: Number, default: 0, min: 0 },
    remainingQuantity: { type: Number, default: 0, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    disputedAmount: { type: Number, required: true, min: 0 },
    disputedAccountIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    isPartial: { type: Boolean, default: false, index: true },

    messages: {
      type: [disputeMessageSchema],
      default: [],
    },
    openedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DisputeChat',
      default: null,
      index: true,
    },
    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    latestReplacementVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
    ocrFlagCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    violationCountSnapshot: {
      type: Number,
      default: 0,
      min: 0,
    },
    credentialsExpireAt: {
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

disputeSchema.index({ status: 1, createdAt: -1 });
disputeSchema.index({ buyer: 1, createdAt: -1 });
disputeSchema.index({ seller: 1, createdAt: -1 });

const Dispute = mongoose.models.Dispute || mongoose.model('Dispute', disputeSchema);

export default Dispute;
