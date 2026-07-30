import {
  User,
  BuyerProfile,
  SellerProfile,
  AdminProfile,
} from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { USER_ROLES, STAFF_ROLES } from '../constants/roles.js';
import { publicUser } from './auth.service.js';
import { logActivity } from './activity.service.js';
import { listActivityLogs } from './activity.service.js';

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

export async function adminUpdateSellerStatus(sellerId, payload, actorId) {
  const seller = await SellerProfile.findById(sellerId);
  if (!seller) {
    throw new AppError('Seller not found', 404, { code: 'SELLER_NOT_FOUND' });
  }

  if (payload.status !== undefined) seller.status = payload.status;
  if (payload.verified !== undefined) seller.verified = payload.verified;
  if (payload.verificationStatus !== undefined) {
    seller.verificationStatus = payload.verificationStatus;
  }

  await seller.save();

  await logActivity({
    userId: actorId,
    action: 'sellers.admin.update',
    resource: 'SellerProfile',
    resourceId: sellerId,
    meta: payload,
  });

  return seller.toObject();
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
  adminUpdateSellerStatus,
  getMyActivity,
};
