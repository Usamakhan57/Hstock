import mongoose from 'mongoose';

const buyerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    bio: {
      type: String,
      maxlength: 2000,
      default: '',
    },
    avatar: {
      type: String,
      default: null,
    },
    coverUrl: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
    postalCode: {
      type: String,
      default: null,
    },
    preferences: {
      marketing: { type: Boolean, default: false },
      orderUpdates: { type: Boolean, default: true },
      newArrivals: { type: Boolean, default: false },
      telegramNotifications: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

const BuyerProfile =
  mongoose.models.BuyerProfile || mongoose.model('BuyerProfile', buyerProfileSchema);

export default BuyerProfile;
