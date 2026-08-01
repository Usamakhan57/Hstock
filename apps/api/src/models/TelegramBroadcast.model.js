import mongoose from 'mongoose';

export const TELEGRAM_BROADCAST_CATEGORIES = Object.freeze([
  'maintenance',
  'security',
  'platform_update',
  'new_feature',
  'system_notice',
  'holiday',
  'promotion',
  'new_category',
  'payment_method',
  'general',
]);

export const TELEGRAM_BROADCAST_STATUS = Object.freeze([
  'draft',
  'queued',
  'sending',
  'completed',
  'failed',
  'cancelled',
]);

const telegramBroadcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3500,
    },
    category: {
      type: String,
      enum: TELEGRAM_BROADCAST_CATEGORIES,
      default: 'general',
      index: true,
    },
    status: {
      type: String,
      enum: TELEGRAM_BROADCAST_STATUS,
      default: 'queued',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    audience: {
      type: String,
      enum: ['all', 'buyers', 'sellers', 'connected'],
      default: 'connected',
    },
    stats: {
      targeted: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

telegramBroadcastSchema.index({ createdAt: -1 });

const TelegramBroadcast =
  mongoose.models.TelegramBroadcast
  || mongoose.model('TelegramBroadcast', telegramBroadcastSchema);

export default TelegramBroadcast;
