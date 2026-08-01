import mongoose from 'mongoose';

const telegramConnectTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    consumedByTelegramUserId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

telegramConnectTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TelegramConnectToken =
  mongoose.models.TelegramConnectToken
  || mongoose.model('TelegramConnectToken', telegramConnectTokenSchema);

export default TelegramConnectToken;
