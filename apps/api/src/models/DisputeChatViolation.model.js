import mongoose from 'mongoose';

/**
 * Tracks contact-filter violations per user (marketplace-wide),
 * with per-dispute history for moderation.
 */
const historySchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    dispute: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispute' },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'DisputeChat' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    rules: [{ type: String }],
    messagePreview: { type: String, maxlength: 500 },
    actionTaken: { type: String },
  },
  { _id: false },
);

const disputeChatViolationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
    mutedUntil: {
      type: Date,
      default: null,
      index: true,
    },
    adminNotifiedAt: {
      type: Date,
      default: null,
    },
    adminNotified: {
      type: Boolean,
      default: false,
      index: true,
    },
    history: {
      type: [historySchema],
      default: [],
    },
  },
  { timestamps: true },
);

const DisputeChatViolation = mongoose.models.DisputeChatViolation
  || mongoose.model('DisputeChatViolation', disputeChatViolationSchema);

export default DisputeChatViolation;
