import mongoose from 'mongoose';
import { LEDGER_CURRENCY } from '../constants/currencies.js';
import {
  PRODUCT_TYPE_VALUES,
  DELIVERY_TYPE_VALUES,
  LICENSE_TYPE_VALUES,
  STOCK_TYPE_VALUES,
  PRODUCT_VISIBILITY_VALUES,
  PRODUCT_STATUS_VALUES,
  APPROVAL_STATUS_VALUES,
  PRODUCT_STATUS,
  APPROVAL_STATUS,
  PRODUCT_VISIBILITY,
  STOCK_TYPES,
  DELIVERY_TYPES,
} from '../constants/productTypes.js';
import {
  ASSET_BLOCKING_STATUSES,
  ASSET_PLATFORM_VALUES,
} from '../constants/assetUniqueness.js';

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: 50000,
    },
    shortDescription: {
      type: String,
      default: '',
      maxlength: 500,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: LEDGER_CURRENCY,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      default: null,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
      index: true,
    },
    collection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      default: null,
      index: true,
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    thumbnail: {
      type: String,
      default: null,
    },
    gallery: [
      {
        type: String,
      },
    ],
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: PRODUCT_STATUS_VALUES,
      default: PRODUCT_STATUS.DRAFT,
      index: true,
    },
    visibility: {
      type: String,
      enum: PRODUCT_VISIBILITY_VALUES,
      default: PRODUCT_VISIBILITY.PUBLIC,
    },
    approvalStatus: {
      type: String,
      enum: APPROVAL_STATUS_VALUES,
      default: APPROVAL_STATUS.PENDING,
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    deliveryType: {
      type: String,
      enum: DELIVERY_TYPE_VALUES,
      default: DELIVERY_TYPES.AUTOMATIC,
    },
    productType: {
      type: String,
      enum: PRODUCT_TYPE_VALUES,
      required: true,
      index: true,
    },
    /**
     * Raw marketplace asset identifier as provided by the seller
     * (email, username, domain, URL, repo key, etc.).
     */
    assetIdentifier: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },
    /**
     * Canonical normalized form used for global uniqueness + search.
     */
    assetIdentifierNormalized: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },
    assetPlatform: {
      type: String,
      enum: ASSET_PLATFORM_VALUES,
      default: null,
      index: true,
    },
    licenseType: {
      type: String,
      enum: LICENSE_TYPE_VALUES,
      default: null,
    },
    stockType: {
      type: String,
      enum: STOCK_TYPE_VALUES,
      default: STOCK_TYPES.LIMITED,
    },
    seoTitle: {
      type: String,
      default: null,
    },
    seoDescription: {
      type: String,
      default: null,
    },
    seoKeywords: [
      {
        type: String,
        trim: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true, suppressReservedKeysWarning: true },
);

productSchema.index({ title: 'text', shortDescription: 'text', description: 'text' });
productSchema.index({ status: 1, visibility: 1, approvalStatus: 1 });
productSchema.index({ deletedAt: 1, status: 1, visibility: 1, approvalStatus: 1, createdAt: -1 });
productSchema.index({ category: 1, status: 1, visibility: 1, approvalStatus: 1, deletedAt: 1, createdAt: -1 });
productSchema.index({ brand: 1, status: 1, visibility: 1, approvalStatus: 1, deletedAt: 1 });
productSchema.index({ collection: 1, status: 1, visibility: 1, approvalStatus: 1, deletedAt: 1 });
productSchema.index({ featured: 1, status: 1, visibility: 1, approvalStatus: 1, deletedAt: 1 });
productSchema.index({ seller: 1, status: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ assetIdentifierNormalized: 1 });

// Global uniqueness among blocking (active) listings only.
// Soft-deleted / rejected / archived products do not occupy the index.
productSchema.index(
  { assetIdentifierNormalized: 1 },
  {
    name: 'uniq_blocking_asset_identifier',
    unique: true,
    partialFilterExpression: {
      assetIdentifierNormalized: { $type: 'string' },
      deletedAt: null,
      status: { $in: [...ASSET_BLOCKING_STATUSES] },
    },
  },
);

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
