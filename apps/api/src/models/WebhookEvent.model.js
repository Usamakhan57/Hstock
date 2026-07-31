import mongoose from 'mongoose';
import {
  WEBHOOK_EVENT_STATUS,
  WEBHOOK_EVENT_STATUS_VALUES,
} from '../constants/statuses.js';

/**
 * Persisted inbound webhook events for replay + duplicate protection.
 */
const webhookEventSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['cryptomus'],
      default: 'cryptomus',
      index: true,
    },
    eventKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    externalId: {
      type: String,
      default: null,
      index: true,
    },
    orderId: {
      type: String,
      default: null,
      index: true,
    },
    signature: {
      type: String,
      default: null,
    },
    payloadHash: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: WEBHOOK_EVENT_STATUS_VALUES,
      default: WEBHOOK_EVENT_STATUS.RECEIVED,
      index: true,
    },
    providerStatus: {
      type: String,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    attempts: {
      type: Number,
      default: 1,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    lastError: {
      type: String,
      default: null,
      maxlength: 2000,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

webhookEventSchema.index({ createdAt: -1 });
webhookEventSchema.index({ status: 1, createdAt: -1 });

const WebhookEvent =
  mongoose.models.WebhookEvent || mongoose.model('WebhookEvent', webhookEventSchema);

export default WebhookEvent;
