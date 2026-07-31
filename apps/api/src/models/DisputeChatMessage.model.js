import mongoose from 'mongoose';
import {
  DISPUTE_CHAT_MESSAGE_STATUS,
  DISPUTE_CHAT_MESSAGE_STATUS_VALUES,
  DISPUTE_CHAT_ROLE_VALUES,
  DISPUTE_CHAT_OCR_STATUS,
  DISPUTE_CHAT_OCR_STATUS_VALUES,
  DISPUTE_CHAT_ATTACHMENT_REVIEW_STATUS,
  DISPUTE_CHAT_ATTACHMENT_REVIEW_STATUS_VALUES,
} from '../constants/disputeChat.js';

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    filename: { type: String, default: null },
    extension: { type: String, default: null },

    /** OCR pipeline */
    ocrStatus: {
      type: String,
      enum: DISPUTE_CHAT_OCR_STATUS_VALUES,
      default: DISPUTE_CHAT_OCR_STATUS.SKIPPED,
    },
    ocrText: {
      type: String,
      default: null,
      maxlength: 50000,
    },
    ocrConfidence: {
      type: Number,
      default: null,
    },
    ocrFindings: [
      {
        type: String,
      },
    ],
    ocrError: {
      type: String,
      default: null,
    },

    /**
     * Screenshots are NEVER auto-rejected.
     * Sensitive OCR hits only flag for moderator review.
     */
    flaggedForReview: {
      type: Boolean,
      default: false,
      index: true,
    },
    warningBadge: {
      type: Boolean,
      default: false,
    },
    adminReviewStatus: {
      type: String,
      enum: DISPUTE_CHAT_ATTACHMENT_REVIEW_STATUS_VALUES,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewNote: {
      type: String,
      default: null,
      maxlength: 2000,
    },
  },
  { _id: true },
);

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
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    /** True when any attachment was OCR-flagged for moderator review. */
    hasFlaggedAttachments: {
      type: Boolean,
      default: false,
      index: true,
    },
    /** Moderator-facing warning badge (not shown to buyer/seller clients). */
    moderatorWarningBadge: {
      type: Boolean,
      default: false,
    },
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
disputeChatMessageSchema.index({ chat: 1, hasFlaggedAttachments: 1 });

const DisputeChatMessage = mongoose.models.DisputeChatMessage
  || mongoose.model('DisputeChatMessage', disputeChatMessageSchema);

export default DisputeChatMessage;
