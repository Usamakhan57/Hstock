import mongoose from 'mongoose';
import { REPLACEMENT_STATUS, REPLACEMENT_STATUS_VALUES } from '../constants/disputeFinal.js';

const replacementAccountSchema = new mongoose.Schema(
  {
    accountIdentifier: { type: String, required: true, trim: true, maxlength: 200 },
    notes: { type: String, default: '', maxlength: 2000 },
    /** Encrypted sensitive fields — never return raw in list APIs */
    encrypted: {
      username: { type: String, default: null },
      email: { type: String, default: null },
      password: { type: String, default: null },
      otp: { type: String, default: null },
      recoveryCode: { type: String, default: null },
      backupCode: { type: String, default: null },
      twoFactorRecoveryCode: { type: String, default: null },
      secretKey: { type: String, default: null },
      licenseKey: { type: String, default: null },
      apiKey: { type: String, default: null },
      recoveryEmail: { type: String, default: null },
      recoveryPhone: { type: String, default: null },
    },
    masked: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: true },
);

const disputeReplacementSchema = new mongoose.Schema(
  {
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
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DisputeChat',
      default: null,
      index: true,
    },
    version: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: REPLACEMENT_STATUS_VALUES,
      default: REPLACEMENT_STATUS.PENDING,
      index: true,
    },
    accounts: {
      type: [replacementAccountSchema],
      default: [],
    },
    accountCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      default: '',
      maxlength: 5000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    responseNote: {
      type: String,
      default: null,
      maxlength: 5000,
    },
    credentialsExpireAt: {
      type: Date,
      default: null,
      index: true,
    },
    credentialsExpired: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

disputeReplacementSchema.index({ dispute: 1, version: 1 }, { unique: true });
disputeReplacementSchema.index({ dispute: 1, status: 1, createdAt: -1 });

const DisputeReplacement = mongoose.models.DisputeReplacement
  || mongoose.model('DisputeReplacement', disputeReplacementSchema);

export default DisputeReplacement;
