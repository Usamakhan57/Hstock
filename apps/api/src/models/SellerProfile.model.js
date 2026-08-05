import mongoose from 'mongoose';
import { SellerStatusEnum, VerificationStatusEnum } from '../constants/enums.js';
import { SUPPORTED_COINS, CRYPTOMUS_NETWORKS } from '../constants/coins.js';

const withdrawalWalletSchema = new mongoose.Schema(
  {
    coin: {
      type: String,
      enum: SUPPORTED_COINS,
      required: true,
    },
    network: {
      type: String,
      enum: CRYPTOMUS_NETWORKS,
      required: true,
    },
    walletAddress: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      trim: true,
      default: '',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true },
);

const sellerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    ownerName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
      sparse: true,
      unique: true,
    },
    phone: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      default: null,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    avatar: {
      type: String,
      default: null,
    },
    logo: {
      type: String,
      default: null,
    },
    banner: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 5000,
      default: '',
    },
    specialty: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(SellerStatusEnum),
      default: SellerStatusEnum.Pending,
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatusEnum),
      default: VerificationStatusEnum.Unverified,
    },
    verified: {
      type: Boolean,
      default: false,
      index: true,
    },
    /** Alias-friendly permanent verification metadata (non-breaking). */
    verifiedAt: {
      type: Date,
      default: null,
    },
    verificationFeePaid: {
      type: Number,
      default: null,
      min: 0,
    },
    verificationSource: {
      type: String,
      enum: ['wallet', 'admin', null],
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    commissionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 15,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    /**
     * Future wallet payout destinations.
     * Withdrawal execution is NOT implemented in this phase.
     */
    withdrawalWallets: {
      type: [withdrawalWalletSchema],
      default: [],
    },
    /** Legacy single payout destination kept for architecture parity */
    payout: {
      asset: { type: String, default: null },
      network: { type: String, default: null },
      walletAddress: { type: String, default: null },
    },
    shippingPolicy: {
      type: String,
      default: null,
    },
    defaultProcessingTime: {
      type: String,
      default: null,
    },
    notifications: {
      newOrders: { type: Boolean, default: true },
      newReviews: { type: Boolean, default: true },
      payouts: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
    },
    metrics: {
      productsCount: { type: Number, default: 0 },
      totalSales: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      responseTime: { type: String, default: null },
    },
    /** Denormalized paid store promotion flags for fast ranking queries */
    storePromotionActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    storePromotedUntil: {
      type: Date,
      default: null,
      index: true,
    },
    activeStorePromotion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StorePromotion',
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

sellerProfileSchema.index({ status: 1, verified: 1 });
sellerProfileSchema.index({ storePromotionActive: 1, storePromotedUntil: -1 });

const SellerProfile =
  mongoose.models.SellerProfile || mongoose.model('SellerProfile', sellerProfileSchema);

export default SellerProfile;
