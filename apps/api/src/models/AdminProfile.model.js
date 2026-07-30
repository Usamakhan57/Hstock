import mongoose from 'mongoose';
import { USER_ROLES } from '../constants/roles.js';

const adminProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default: null,
    },
    department: {
      type: String,
      default: null,
    },
    title: {
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
    timezone: {
      type: String,
      default: 'UTC',
    },
    staffRole: {
      type: String,
      enum: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.EDITOR, USER_ROLES.SUPPORT],
      default: USER_ROLES.ADMIN,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

const AdminProfile =
  mongoose.models.AdminProfile || mongoose.model('AdminProfile', adminProfileSchema);

export default AdminProfile;
