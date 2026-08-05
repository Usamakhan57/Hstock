import mongoose from 'mongoose';
import {
  User,
  BuyerProfile,
  SellerProfile,
  AdminProfile,
  Product,
  PasswordResetToken,
} from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { USER_ROLES, STAFF_ROLES } from '../constants/roles.js';
import { UserStatusEnum, SellerStatusEnum, VerificationStatusEnum } from '../constants/enums.js';
import {
  APPROVAL_STATUS,
  PRODUCT_STATUS,
  PRODUCT_VISIBILITY,
} from '../constants/productTypes.js';
import { publicUser } from './auth.service.js';
import { logActivity } from './activity.service.js';
import { listActivityLogs } from './activity.service.js';
import { generateOpaqueToken, hashToken } from '../utils/token.js';
import { sendTemplatedEmail } from '../emails/email.service.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const INVITEABLE_ROLES = Object.freeze([
  USER_ROLES.ADMIN,
  USER_ROLES.EDITOR,
  USER_ROLES.SUPPORT,
]);

const ROLE_LABEL = Object.freeze({
  [USER_ROLES.ADMIN]: 'Admin',
  [USER_ROLES.EDITOR]: 'Editor',
  [USER_ROLES.SUPPORT]: 'Support',
  [USER_ROLES.SUPER_ADMIN]: 'Super Admin',
});

function serializeSeller(seller) {
  if (!seller) return null;
  const obj = typeof seller.toObject === 'function' ? seller.toObject() : { ...seller };
  const commissionRate = obj.commissionRate ?? 15;
  let approvedBy = obj.approvedBy || null;
  if (approvedBy && typeof approvedBy === 'object') {
    approvedBy = {
      id: String(approvedBy._id || approvedBy.id),
      name: approvedBy.name || null,
      email: approvedBy.email || null,
    };
  } else if (approvedBy) {
    approvedBy = String(approvedBy);
  }
  return {
    ...obj,
    id: String(obj._id || obj.id),
    userId: obj.user ? String(obj.user._id || obj.user) : null,
    status: obj.status || SellerStatusEnum.Pending,
    approvedAt: obj.approvedAt || null,
    approvedBy,
    commissionRate,
    commission: commissionRate,
    verified: obj.verified === true,
    sellerVerified: obj.verified === true,
    verifiedAt: obj.verifiedAt || null,
    verificationFeePaid: obj.verificationFeePaid ?? null,
    verificationSource: obj.verificationSource || null,
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
    profiles: {
      buyer,
      seller: seller ? serializeSeller(seller) : null,
      admin,
    },
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

  const blocked = [
    'status',
    'verified',
    'verificationStatus',
    'verifiedAt',
    'verificationFeePaid',
    'verificationSource',
    'verifiedBy',
    'metrics',
    'user',
    'slug',
  ];
  for (const key of Object.keys(payload)) {
    if (!blocked.includes(key)) {
      profile[key] = payload[key];
    }
  }

  await profile.save();
  return serializeSeller(profile);
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
  if (payload.name !== undefined) user.name = String(payload.name).trim();
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

/**
 * Invite a staff user to the Admin Panel.
 * Creates the account as `invited`, issues a set-password token, and emails the invite.
 */
export async function adminInviteUser(payload, actorId) {
  const name = String(payload?.name || '').trim();
  const email = String(payload?.email || '').trim().toLowerCase();
  const role = String(payload?.role || USER_ROLES.EDITOR).trim().toLowerCase();

  if (!name || name.length < 2) {
    throw new AppError('Name is required', 400, { code: 'VALIDATION_ERROR' });
  }
  if (!email || !email.includes('@')) {
    throw new AppError('A valid email is required', 400, { code: 'VALIDATION_ERROR' });
  }
  if (!INVITEABLE_ROLES.includes(role)) {
    throw new AppError('Role must be admin, editor, or support', 400, {
      code: 'VALIDATION_ERROR',
      details: { allowedRoles: INVITEABLE_ROLES },
    });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('A user with this email already exists', 409, {
      code: 'EMAIL_EXISTS',
    });
  }

  const passwordHash = await hashPassword(generateOpaqueToken(32));
  const user = await User.create({
    name,
    email,
    passwordHash,
    roles: [role],
    status: UserStatusEnum.Invited,
    emailVerified: true,
    emailVerifiedAt: new Date(),
    authProvider: 'local',
  });

  await AdminProfile.findOneAndUpdate(
    { user: user._id },
    {
      $setOnInsert: {
        user: user._id,
        displayName: name,
        staffRole: role === USER_ROLES.SUPER_ADMIN ? USER_ROLES.SUPER_ADMIN : role,
      },
    },
    { upsert: true },
  );

  await PasswordResetToken.updateMany(
    { user: user._id, usedAt: null },
    { $set: { usedAt: new Date() } },
  );

  const raw = generateOpaqueToken(32);
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
  await PasswordResetToken.create({
    user: user._id,
    tokenHash: hashToken(raw),
    expiresAt,
  });

  const frontendBase = String(env.FRONTEND_URL || env.APP_URL || '').replace(/\/$/, '');
  const resetUrl = `${frontendBase}/reset-password?token=${encodeURIComponent(raw)}&next=${encodeURIComponent('/admin/login')}`;

  try {
    const emailResult = await sendTemplatedEmail('admin_invite', {
      to: user.email,
      data: {
        name: user.name,
        roleLabel: ROLE_LABEL[role] || role,
        resetUrl,
        expiresInMinutes: 72 * 60,
      },
    });
    logger.info('Admin invite email dispatch result', {
      userId: String(user._id),
      sent: emailResult.sent,
      provider: emailResult.provider,
    });
  } catch (error) {
    // Roll back invite if mail cannot be delivered — avoid orphaned invited accounts.
    await PasswordResetToken.deleteMany({ user: user._id });
    await AdminProfile.deleteOne({ user: user._id });
    await User.deleteOne({ _id: user._id });
    throw error;
  }

  await logActivity({
    userId: actorId,
    action: 'users.admin.invite',
    resource: 'User',
    resourceId: user._id,
    meta: { email, role },
  });

  return {
    user: publicUser(user),
    ...(env.isProduction ? {} : { resetUrl, expiresAt }),
  };
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

/** Hide previously public listings when a seller loses approval. */
async function unpublishSellerProducts(sellerId) {
  await Product.updateMany(
    {
      seller: sellerId,
      deletedAt: null,
      approvalStatus: APPROVAL_STATUS.APPROVED,
    },
    {
      $set: {
        approvalStatus: APPROVAL_STATUS.PENDING,
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

  if (becomingApproved) {
    // Approval unlocks selling — permanent Verified badge is purchased separately.
    seller.approvedAt = seller.approvedAt || new Date();
    seller.approvedBy = actorId || seller.approvedBy;
  }

  // Explicit admin verification overrides (also used by Seller Verification page).
  if (payload.verified === true) {
    seller.verified = true;
    seller.verificationStatus = VerificationStatusEnum.Verified;
    seller.verifiedAt = seller.verifiedAt || new Date();
    seller.verificationSource = seller.verificationSource || 'admin';
    seller.verifiedBy = actorId || seller.verifiedBy;
  } else if (payload.verified === false) {
    seller.verified = false;
    seller.verificationStatus = VerificationStatusEnum.Unverified;
    seller.verifiedAt = null;
    seller.verificationSource = null;
    seller.verifiedBy = null;
    seller.verificationFeePaid = null;
  }

  if (
    payload.status
    && [SellerStatusEnum.Rejected, SellerStatusEnum.Suspended, SellerStatusEnum.Pending].includes(payload.status)
  ) {
    // Keep permanent verification history on pending; clear active badge when rejected/suspended.
    if (payload.status !== SellerStatusEnum.Pending && payload.verified !== true) {
      // Do not wipe paid verification metadata unless explicitly unverifying.
      // Suspended stores simply won't appear publicly (status filter).
    }
  }

  await seller.save();

  if (seller.status === SellerStatusEnum.Approved) {
    await publishSellerProducts(seller._id);
  } else if (
    previousStatus === SellerStatusEnum.Approved
    && [SellerStatusEnum.Pending, SellerStatusEnum.Rejected, SellerStatusEnum.Suspended].includes(seller.status)
  ) {
    await unpublishSellerProducts(seller._id);
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
  // Buyer/seller activity feed must never surface auth/audit noise.
  const { items, total } = await listActivityLogs({
    userId,
    page,
    limit,
    excludeHidden: true,
  });
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
  adminInviteUser,
  adminListSellers,
  adminGetSeller,
  adminUpdateSellerStatus,
  findSellerProfileByIdOrUserId,
  getMyActivity,
};
