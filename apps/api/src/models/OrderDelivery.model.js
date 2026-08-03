import mongoose from 'mongoose';

/**
 * Delivered Instant Access credentials for an order.
 * Survives order completion — never deleted when escrow releases.
 */
const deliveredAccountSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true, min: 0 },
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductInventoryItem',
      default: null,
    },
    label: { type: String, default: null, maxlength: 200 },
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
  },
  { _id: true },
);

const orderDeliverySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
    },
    deliveryType: {
      type: String,
      default: 'automatic',
    },
    sourceFormat: {
      type: String,
      default: 'paste',
    },
    accounts: {
      type: [deliveredAccountSchema],
      default: [],
    },
    accountCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const OrderDelivery = mongoose.models.OrderDelivery
  || mongoose.model('OrderDelivery', orderDeliverySchema);

export default OrderDelivery;
