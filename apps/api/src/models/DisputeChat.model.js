import mongoose from 'mongoose';
import {
  DISPUTE_CHAT_STATUS,
  DISPUTE_CHAT_STATUS_VALUES,
} from '../constants/disputeChat.js';

const muteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    until: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      default: 'repeat_violation',
    },
  },
  { _id: false },
);

const disputeChatSchema = new mongoose.Schema(
  {
    dispute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispute',
      required: true,
      unique: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sellerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
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
    status: {
      type: String,
      enum: DISPUTE_CHAT_STATUS_VALUES,
      default: DISPUTE_CHAT_STATUS.OPEN,
      index: true,
    },
    mutes: {
      type: [muteSchema],
      default: [],
    },
    messageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    readOnlyAt: {
      type: Date,
      default: null,
    },
    credentialsExpireAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

disputeChatSchema.index({ buyer: 1, status: 1 });
disputeChatSchema.index({ sellerUser: 1, status: 1 });
disputeChatSchema.index({ assignedAdmin: 1, status: 1 });

const DisputeChat = mongoose.models.DisputeChat
  || mongoose.model('DisputeChat', disputeChatSchema);

export default DisputeChat;
