import mongoose from 'mongoose';
import { DISPUTE_CHAT_AUDIT_ACTION_VALUES } from '../constants/disputeChat.js';

const disputeChatAuditLogSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DisputeChat',
      required: true,
      index: true,
    },
    dispute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispute',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    action: {
      type: String,
      enum: DISPUTE_CHAT_AUDIT_ACTION_VALUES,
      required: true,
      index: true,
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DisputeChatMessage',
      default: null,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

disputeChatAuditLogSchema.index({ chat: 1, createdAt: -1 });
disputeChatAuditLogSchema.index({ action: 1, createdAt: -1 });

const DisputeChatAuditLog = mongoose.models.DisputeChatAuditLog
  || mongoose.model('DisputeChatAuditLog', disputeChatAuditLogSchema);

export default DisputeChatAuditLog;
