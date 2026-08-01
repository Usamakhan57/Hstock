import mongoose from 'mongoose';
import {
  User,
  BuyerProfile,
  SellerProfile,
  AdminProfile,
  Product,
} from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { USER_ROLES, STAFF_ROLES } from '../constants/roles.js';
import { SellerStatusEnum, VerificationStatusEnum } from '../constants/enums.js';
import {
  APPROVAL_STATUS,
  PRODUCT_STATUS,
  PRODUCT_VISIBILITY,
} from '../constants/productTypes.js';
import { publicUser } from './auth.service.js';
import { logActivity } from './activity.service.js';
import { listActivityLogs } from './activity.service.js';

function serializeSeller(seller) {
  if (!seller) return null;
  const obj = typeof seller.toObject === 'function' ? seller.toObject() : { ...seller };
  return {
    ...obj,
    id: String(obj._id || obj.id),
    userId: obj.user ? String(obj.user._id || obj.user) : null,
  };
}

/**
 * Resolve a seller profile by SellerProfile _id OR owning User _id.
 * Admin UI historically mixed both identifiers.
 */
export async function findSellerProfileByIdOrUserId(id) {
  if (!id || !mongoose.isValidObjectId(id)) return null;
  const byProfile = await SellerProfile.findById(id);
  if (byProfile) return byProfile;
  return SellerProfile.findOne({ user: id });
}

export async function getUserById(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
  }

  const [buyer, seller, admin] = await Promise.all([
    BuyerProfile.findOne({ user: userId }).lean(),
    SellerProfile.findOne({ user: userId }).lean(),
    AdminProfile.findOne({ user: userId }).lean(),
  ]);

  return {
    user: publicUser(user),
    profiles: { buyer, seller, admin },
  };
}

export async function updateCurrentUser(userId, payload) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
  }

  const allowed = ['name', 'phone', 'country', 'timezone', 'avatar'];
  for (const key of allowed) {
    if (payload[key] !== undefined) {
      user[key] = payload[key];
    }
  }

  await user.save();
  await logActivity({
    userId,
    action: 'users.update',
    resource: 'User',
    resourceId: userId,
  });

  return publicUser(user);
}

export async function updateBuyerProfile(userId, payload) {
  const profile = await BuyerProfile.findOneAndUpdate(
    { user: userId },
    { $set: payload },
    { new: true, upsert: true },
  ).lean();

  return profile;
}

export async function updateSellerProfile(userId, payload) {
  const profile = await SellerProfile.findOne({ user: userId });
  if (!profile) {
    throw new AppError('Seller profile not found', 404, { code: 'SELLER_NOT_FOUND' });
  }

  const blocked = ['status', 'verified', 'verificationStatus', 'metrics', 'user', 'slug'];
  for (const key of Object.keys(payload)) {
    if (!blocked.includes(key)) {
      profile[key] = payload[key];
    }
  }

  await profile.save();
  return profile.toObject();
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
  }

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError('Current password is incorrect', 400, {
      code: 'INVALID_PASSWORD',
    });
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  await logActivity({
    userId,
    action: 'users.password.change',
    resource: 'User',
    resourceId: userId,
  });

  return { changed: true };
}

export async function listUsers(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.role) filter.roles = query.role;
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.$or = [
      { email: new RegExp(query.search, 'i') },
      { name: new RegExp(query.search, 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    items: items.map((user) => publicUser(user)),
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

export async function adminUpdateUser(userId, payload, actorId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
  }

  if (payload.status !== undefined) user.status = payload.status;
  if (payload.verificationStatus !== undefined) {
    user.verificationStatus = payload.verificationStatus;
  }
  if (payload.roles !== undefined) {
    user.roles = payload.roles;
  }
  if (payload.emailVerified !== undefined) {
    user.emailVerified = payload.emailVerified;
  }

  await user.save();

  if (payload.roles?.some((role) => STAFF_ROLES.includes(role))) {
    await AdminProfile.findOneAndUpdate(
      { user: userId },
      {
        $setOnInsert: {
          user: userId,
          displayName: user.name,
          staffRole: payload.roles.includes(USER_ROLES.SUPER_ADMIN)
            ? USER_ROLES.SUPER_ADMIN
            : USER_ROLES.ADMIN,
        },
      },
      { upsert: true },
    );
  }

  await logActivity({
    userId: actorId,
    action: 'users.admin.update',
    resource: 'User',
    resourceId: userId,
    meta: payload,
  });

  return publicUser(user);
}

export async function adminListSellers(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.$or = [
      { storeName: new RegExp(query.search, 'i') },
      { ownerName: new RegExp(query.search, 'i') },
      { email: new RegExp(query.search, 'i') },
      { slug: new RegExp(query.search, 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    SellerProfile.find(filter)
      .populate('user', 'name email roles status')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SellerProfile.countDocuments(filter),
  ]);

  return {
    items: items.map(serializeSeller),
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

export async function adminGetSeller(sellerOrUserId) {
  const seller = await findSellerProfileByIdOrUserId(sellerOrUserId);
  if (!seller) {
    throw new AppError('Seller not found', 404, { code: 'SELLER_NOT_FOUND' });
  }
  await seller.populate([
    { path: 'user', select: 'name email roles status' },
    { path: 'approvedBy', select: 'name email' },
  ]);
  return serializeSeller(seller);
}

async function publishSellerProducts(sellerId) {
  const now = new Date();
  await Product.updateMany(
    {
      seller: sellerId,
      deletedAt: null,
      status: PRODUCT_STATUS.LIVE,
      visibility: PRODUCT_VISIBILITY.PUBLIC,
      approvalStatus: { $ne: APPROVAL_STATUS.REJECTED },
    },
    {
      $set: {
        approvalStatus: APPROVAL_STATUS.APPROVED,
        publishedAt: now,
      },
    },
  );
}

export async function adminUpdateSellerStatus(sellerOrUserId, payload, actorId) {
  const seller = await findSellerProfileByIdOrUserId(sellerOrUserId);
  if (!seller) {
    throw new AppError('Seller not found', 404, { code: 'SELLER_NOT_FOUND' });
  }

  const previousStatus = seller.status;

  if (payload.status !== undefined) seller.status = payload.status;
  if (payload.verified !== undefined) seller.verified = payload.verified;
  if (payload.verificationStatus !== undefined) {
    seller.verificationStatus = payload.verificationStatus;
  }
  if (payload.commissionRate !== undefined) seller.commissionRate = payload.commissionRate;
  if (payload.storeName !== undefined) seller.storeName = payload.storeName;
  if (payload.ownerName !== undefined) seller.ownerName = payload.ownerName;
  if (payload.email !== undefined) seller.email = payload.email;
  if (payload.phone !== undefined) seller.phone = payload.phone;
  if (payload.specialty !== undefined) seller.specialty = payload.specialty;
  if (payload.bio !== undefined) seller.bio = payload.bio;

  const becomingApproved = seller.status === SellerStatusEnum.Approved
    && previousStatus !== SellerStatusEnum.Approved;

  if (becomingApproved || (payload.verified === true && seller.status === SellerStatusEnum.Approved)) {
    seller.verified = true;
    if (!seller.verificationStatus || seller.verificationStatus === VerificationStatusEnum.Unverified) {
      seller.verificationStatus = VerificationStatusEnum.Verified;
    }
    seller.approvedAt = seller.approvedAt || new Date();
    seller.approvedBy = actorId || seller.approvedBy;
  }

  if (
    payload.status
    && [SellerStatusEnum.Rejected, SellerStatusEnum.Suspended, SellerStatusEnum.Pending].includes(payload.status)
  ) {
    // Keep historical approvedAt for audit; only clear active verification flags when rejected/suspended.
    if (payload.status !== SellerStatusEnum.Pending) {
      seller.verified = false;
    }
  }

  await seller.save();

  if (seller.status === SellerStatusEnum.Approved) {
    await publishSellerProducts(seller._id);
  }

  await logActivity({
    userId: actorId,
    action: 'sellers.admin.update',
    resource: 'SellerProfile',
    resourceId: seller._id,
    meta: payload,
  });

  await seller.populate([
    { path: 'user', select: 'name email roles status' },
    { path: 'approvedBy', select: 'name email' },
  ]);

  return serializeSeller(seller);
}

export async function getMyActivity(userId, query = {}) {
  const { page, limit } = parsePagination(query);
  const { items, total } = await listActivityLogs({ userId, page, limit });
  return {
    items,
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

export default {
  getUserById,
  updateCurrentUser,
  updateBuyerProfile,
  updateSellerProfile,
  changePassword,
  listUsers,
  adminUpdateUser,
  adminListSellers,
  adminGetSeller,
  adminUpdateSellerStatus,
  findSellerProfileByIdOrUserId,
  getMyActivity,
};
