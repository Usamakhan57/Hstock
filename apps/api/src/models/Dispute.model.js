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
