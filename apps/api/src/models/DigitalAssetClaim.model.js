import mongoose from 'mongoose';
import {
  ASSET_CLAIM_STATUS,
  ASSET_PLATFORM_VALUES,
} from '../constants/assetUniqueness.js';
import { PRODUCT_TYPE_VALUES } from '../constants/productTypes.js';

/**
 * Global reservation of a normalized digital asset identifier.
 * One document per assetIdentifierNormalized (unique).
 * status=claimed blocks marketplace duplicates; status=released allows reuse.
 */
const digitalAssetClaimSchema = new mongoose.Schema(
  {
    assetIdentifier: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    assetIdentifierNormalized: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    assetPlatform: {
      type: String,
      enum: ASSET_PLATFORM_VALUES,
      default: 'generic',
      index: true,
    },
    productType: {
      type: String,
      enum: PRODUCT_TYPE_VALUES,
      default: null,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ASSET_CLAIM_STATUS),
      default: ASSET_CLAIM_STATUS.CLAIMED,
      index: true,
    },
    claimedAt: {
      type: Date,
      default: Date.now,
    },
    releasedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Primary uniqueness guard — prevents concurrent duplicate claims
digitalAssetClaimSchema.index({ assetIdentifierNormalized: 1 }, { unique: true });
digitalAssetClaimSchema.index({ status: 1, assetIdentifierNormalized: 1 });
digitalAssetClaimSchema.index({ product: 1, status: 1 });

const DigitalAssetClaim = mongoose.models.DigitalAssetClaim
  || mongoose.model('DigitalAssetClaim', digitalAssetClaimSchema);

export default DigitalAssetClaim;
