import mongoose from 'mongoose';

/**
 * Tracks background job executions for observability and retry bookkeeping.
 */
const jobRunSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['running', 'success', 'failed'],
      default: 'running',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    finishedAt: {
      type: Date,
      default: null,
    },
    processed: {
      type: Number,
      default: 0,
    },
    succeeded: {
      type: Number,
      default: 0,
    },
    failed: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
      default: null,
      maxlength: 4000,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

jobRunSchema.index({ name: 1, createdAt: -1 });

const JobRun = mongoose.models.JobRun || mongoose.model('JobRun', jobRunSchema);

export default JobRun;
