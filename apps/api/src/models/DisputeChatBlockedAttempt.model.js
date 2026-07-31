import mongoose from 'mongoose';

/**
 * Admin-visible log of blocked dispute chat messages (not saved as chat messages).
 */
const disputeChatBlockedAttemptSchema = new mongoose.Schema(
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      default: null,
    },
    originalMessage: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    detectedRules: [
      {
        type: String,
      },
    ],
    attachments: [
      {
        type: String,
      },
    ],
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    violationCountAfter: {
      type: Number,
      default: null,
    },
    actionTaken: {
      type: String,
      enum: ['warning', 'mute', 'notify_admin', 'none'],
      default: 'warning',
    },
  },
  { timestamps: true },
);

disputeChatBlockedAttemptSchema.index({ createdAt: -1 });
disputeChatBlockedAttemptSchema.index({ user: 1, createdAt: -1 });

const DisputeChatBlockedAttempt = mongoose.models.DisputeChatBlockedAttempt
  || mongoose.model('DisputeChatBlockedAttempt', disputeChatBlockedAttemptSchema);

export default DisputeChatBlockedAttempt;
