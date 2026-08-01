import mongoose from 'mongoose';
import { USER_ROLE_VALUES } from '../constants/roles.js';
import { UserStatusEnum, VerificationStatusEnum } from '../constants/enums.js';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    roles: {
      type: [
        {
          type: String,
          enum: USER_ROLE_VALUES,
        },
      ],
      default: ['buyer'],
      index: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    country: {
      type: String,
      default: null,
      trim: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(UserStatusEnum),
      default: UserStatusEnum.Active,
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatusEnum),
      default: VerificationStatusEnum.Unverified,
    },
    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastLoginIp: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      default: null,
      select: false,
    },
    /** Telegram account connection for marketplace notifications */
    telegramConnected: {
      type: Boolean,
      default: false,
      index: true,
    },
    telegramChatId: {
      type: String,
      default: null,
      select: false,
    },
    telegramUserId: {
      type: String,
      default: null,
      index: true,
    },
    telegramUsername: {
      type: String,
      default: null,
      trim: true,
    },
    telegramConnectedAt: {
      type: Date,
      default: null,
    },
    telegramLastNotificationAt: {
      type: Date,
      default: null,
    },
    telegramNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.twoFactorSecret;
        delete ret.telegramChatId;
        delete ret.__v;
        return ret;
      },
    },
  },
);

userSchema.index({ createdAt: -1 });
userSchema.index({ roles: 1, status: 1 });
userSchema.index({ telegramConnected: 1, telegramNotificationsEnabled: 1 });
userSchema.index(
  { telegramUserId: 1 },
  {
    unique: true,
    partialFilterExpression: { telegramUserId: { $type: 'string' } },
  },
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
