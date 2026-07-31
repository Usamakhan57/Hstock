import mongoose from 'mongoose';
import { DOWNLOAD_TYPE_VALUES, DOWNLOAD_TYPES } from '../constants/productTypes.js';

/**
 * Digital delivery metadata for a Product.
 * Order / download fulfillment logic is deferred to later phases.
 */
const digitalProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true,
      index: true,
    },
    downloadType: {
      type: String,
      enum: DOWNLOAD_TYPE_VALUES,
      default: DOWNLOAD_TYPES.MANUAL,
    },
    manual: {
      type: Boolean,
      default: true,
    },
    automatic: {
      type: Boolean,
      default: false,
    },
    licenseKey: {
      type: String,
      default: null,
      select: false,
    },
    downloadUrl: {
      type: String,
      default: null,
    },
    externalUrl: {
      type: String,
      default: null,
    },
    deliveryInstructions: {
      type: String,
      default: '',
      maxlength: 10000,
    },
    fileSize: {
      type: Number,
      default: null,
      min: 0,
    },
    fileType: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

const DigitalProduct =
  mongoose.models.DigitalProduct || mongoose.model('DigitalProduct', digitalProductSchema);

export default DigitalProduct;
