import mongoose from 'mongoose';

const passwordResetTokenSchema = new mongoose.Schema(
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
    },
    expiresAt: {
      type: Date,
      required: true,
      // Auto-delete expired tokens from MongoDB.
      index: { expires: 0 },
    },
    usedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

const PasswordResetToken =
  mongoose.models.PasswordResetToken
  || mongoose.model('PasswordResetToken', passwordResetTokenSchema);

export default PasswordResetToken;
