import mongoose from 'mongoose';
import {
  DISPUTE_CHAT_MESSAGE_STATUS,
  DISPUTE_CHAT_MESSAGE_STATUS_VALUES,
  DISPUTE_CHAT_ROLE_VALUES,
} from '../constants/disputeChat.js';

const disputeChatMessageSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: DISPUTE_CHAT_ROLE_VALUES,
      required: true,
    },
    body: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    attachments: [
      {
        url: { type: String, required: true },
        filename: { type: String, default: null },
        extension: { type: String, default: null },
      },
    ],
    status: {
      type: String,
      enum: DISPUTE_CHAT_MESSAGE_STATUS_VALUES,
      default: DISPUTE_CHAT_MESSAGE_STATUS.VISIBLE,
      index: true,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);

disputeChatMessageSchema.index({ chat: 1, createdAt: -1 });
disputeChatMessageSchema.index({ author: 1, createdAt: -1 });

const DisputeChatMessage = mongoose.models.DisputeChatMessage
  || mongoose.model('DisputeChatMessage', disputeChatMessageSchema);

export default DisputeChatMessage;
