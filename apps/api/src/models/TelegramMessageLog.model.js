import mongoose from 'mongoose';

export const TELEGRAM_MESSAGE_STATUS = Object.freeze([
  'queued',
  'sent',
  'failed',
  'skipped',
]);

export const TELEGRAM_MESSAGE_KINDS = Object.freeze([
  'notification',
  'broadcast',
  'system',
  'connect',
]);

const telegramMessageLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    chatId: {
      type: String,
      default: null,
      select: false,
    },
    kind: {
      type: String,
      enum: TELEGRAM_MESSAGE_KINDS,
      default: 'notification',
      index: true,
    },
    eventType: {
      type: String,
      default: null,
      index: true,
    },
    title: {
      type: String,
      default: '',
      maxlength: 200,
    },
    body: {
      type: String,
      default: '',
      maxlength: 4000,
    },
    status: {
      type: String,
      enum: TELEGRAM_MESSAGE_STATUS,
      default: 'queued',
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    telegramMessageId: {
      type: String,
      default: null,
    },
    error: {
      type: String,
      default: null,
      maxlength: 1000,
    },
    broadcast: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TelegramBroadcast',
      default: null,
      index: true,
    },
    notification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
      default: null,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

telegramMessageLogSchema.index({ createdAt: -1 });
telegramMessageLogSchema.index({ status: 1, createdAt: -1 });

const TelegramMessageLog =
  mongoose.models.TelegramMessageLog
  || mongoose.model('TelegramMessageLog', telegramMessageLogSchema);

export default TelegramMessageLog;
