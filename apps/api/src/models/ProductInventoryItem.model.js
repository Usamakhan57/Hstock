import mongoose from 'mongoose';

export const INVENTORY_ITEM_STATUS = Object.freeze({
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  SOLD: 'sold',
  INVALID: 'invalid',
});

export const INVENTORY_ITEM_STATUS_VALUES = Object.freeze(
  Object.values(INVENTORY_ITEM_STATUS),
);

export const INVENTORY_SOURCE_FORMATS = Object.freeze({
  PASTE: 'paste',
  TXT: 'txt',
  CSV: 'csv',
  XLSX: 'xlsx',
  ZIP: 'zip',
  BULK: 'bulk',
});

export const INVENTORY_SOURCE_FORMAT_VALUES = Object.freeze(
  Object.values(INVENTORY_SOURCE_FORMATS),
);

/**
 * Seller Instant Access stock unit (one deliverable account/credential row).
 * Credentials are stored encrypted; list APIs return masked fields only.
 */
const productInventoryItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: INVENTORY_ITEM_STATUS_VALUES,
      default: INVENTORY_ITEM_STATUS.AVAILABLE,
      index: true,
    },
    sourceFormat: {
      type: String,
      enum: INVENTORY_SOURCE_FORMAT_VALUES,
      default: INVENTORY_SOURCE_FORMATS.PASTE,
    },
    /** Lowercased email (or primary identifier) for uniqueness within a product. */
    emailNormalized: {
      type: String,
      default: null,
      trim: true,
      maxlength: 320,
      index: true,
    },
    /** Hash of normalized credential fingerprint to prevent duplicate rows. */
    fingerprint: {
      type: String,
      required: true,
      index: true,
    },
    /** AES payload: JSON string of credential fields. */
    credentialsEncrypted: {
      type: String,
      required: true,
      select: false,
    },
    credentialsMasked: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    fieldKeys: {
      type: [String],
      default: [],
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    reservedAt: {
      type: Date,
      default: null,
    },
    soldAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

productInventoryItemSchema.index(
  { product: 1, fingerprint: 1 },
  { unique: true },
);
productInventoryItemSchema.index({ product: 1, status: 1, createdAt: 1 });
productInventoryItemSchema.index(
  { product: 1, emailNormalized: 1 },
  {
    unique: true,
    partialFilterExpression: {
      emailNormalized: { $type: 'string' },
      status: { $in: ['available', 'reserved', 'sold'] },
    },
  },
);

const ProductInventoryItem = mongoose.models.ProductInventoryItem
  || mongoose.model('ProductInventoryItem', productInventoryItemSchema);

export default ProductInventoryItem;
