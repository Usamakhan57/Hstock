import mongoose from 'mongoose';
import { DISPUTE_TIMELINE_EVENT_VALUES } from '../constants/disputeFinal.js';

const disputeTimelineSchema = new mongoose.Schema(
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
      default: null,
      index: true,
    },
    event: {
      type: String,
      enum: DISPUTE_TIMELINE_EVENT_VALUES,
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    role: {
      type: String,
      default: null,
    },
    message: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

disputeTimelineSchema.index({ dispute: 1, createdAt: 1 });

const DisputeTimeline = mongoose.models.DisputeTimeline
  || mongoose.model('DisputeTimeline', disputeTimelineSchema);

export default DisputeTimeline;
