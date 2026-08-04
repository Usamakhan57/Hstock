import mongoose from 'mongoose';

/**
 * Keyed CMS documents. Each `key` maps to one admin CMS module payload.
 * Public storefront reads the same documents — no localStorage.
 */
const cmsContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);

const CmsContent =
  mongoose.models.CmsContent || mongoose.model('CmsContent', cmsContentSchema);

export default CmsContent;
