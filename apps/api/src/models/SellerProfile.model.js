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
    website: {
      type: String,
      default: null,
    },
    social: {
      facebook: { type: String, default: null },
      instagram: { type: String, default: null },
      twitter: { type: String, default: null },
      youtube: { type: String, default: null },
      linkedin: { type: String, default: null },
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
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

sellerProfileSchema.index({ status: 1, verified: 1 });

const SellerProfile =
  mongoose.models.SellerProfile || mongoose.model('SellerProfile', sellerProfileSchema);

export default SellerProfile;
