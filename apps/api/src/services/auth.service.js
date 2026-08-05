import {
  User,
  BuyerProfile,
  SellerProfile,
  AdminProfile,
  RefreshToken,
  PasswordResetToken,
  EmailVerificationToken,
} from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateOpaqueToken,
  hashToken,
} from '../utils/token.js';
import { toSlug } from '../utils/slug.js';
import { normalizeUsername, usernameToSlug } from '../utils/username.js';
import { withTransaction } from '../utils/transaction.js';
import { resolvePermissions } from '../constants/permissions.js';
import { USER_ROLES, ADMIN_LOGIN_ROLES } from '../constants/roles.js';
import { UserStatusEnum, VerificationStatusEnum } from '../constants/enums.js';
import { jwtConfig } from '../config/jwt.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { sendTemplatedEmail } from '../emails/email.service.js';
import { logActivity } from './activity.service.js';
import { getSellerRegistrationFee } from './config.service.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

function parseDurationToMs(value) {
  const match = String(value).match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = match[2];
  const map = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return amount * map[unit];
}

function publicUser(user) {
  const roles = user.roles || [];
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    username: user.username || null,
    roles,
    avatar: user.avatar,
    phone: user.phone,
    country: user.country,
    timezone: user.timezone,
    status: user.status,
    deleted: user.deleted === true,
    deletedAt: user.deletedAt || null,
    verificationStatus: user.verificationStatus,
    emailVerified: user.emailVerified,
    lastLoginAt: user.lastLoginAt,
    permissions: resolvePermissions(roles),
    telegram: {
      connected: Boolean(user.telegramConnected),
      username: user.telegramUsername || null,
      telegramUserId: user.telegramUserId || null,
      connectedAt: user.telegramConnectedAt || null,
      notificationsEnabled: user.telegramNotificationsEnabled !== false,
    },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function buildAccessPayload(user) {
  return {
    sub: String(user._id),
    email: user.email,
    roles: user.roles,
    permissions: resolvePermissions(user.roles),
  };
}

async function issueTokenPair(user, meta = {}) {
  const accessToken = signAccessToken(buildAccessPayload(user));
  const refreshToken = signRefreshToken({
    sub: String(user._id),
    jti: generateOpaqueToken(16),
  });
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + parseDurationToMs(jwtConfig.refreshExpiresIn));

  await RefreshToken.create({
    user: user._id,
    tokenHash,
    expiresAt,
    userAgent: meta.userAgent || null,
    ip: meta.ip || null,
  });

  return { accessToken, refreshToken, expiresAt };
}

async function createEmailVerification(user, session = null) {
  const raw = generateOpaqueToken(32);
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const doc = {
    user: user._id,
    email: user.email,
    tokenHash,
    expiresAt,
  };

  if (session) {
    await EmailVerificationToken.create([doc], { session });
  } else {
    await EmailVerificationToken.create(doc);
  }

  const verifyUrl = `${env.APP_URL}${env.API_PREFIX}/auth/verify-email?token=${raw}`;
  await sendTemplatedEmail('verification', {
    to: user.email,
    data: { name: user.name, verifyUrl },
  });

  return { token: raw, expiresAt, verifyUrl };
}

async function createWithSession(Model, doc, session) {
  if (session) {
    const [created] = await Model.create([doc], { session });
    return created;
  }
  return Model.create(doc);
}

export async function registerBuyer(payload, meta = {}) {
  const existing = await User.findOne({ email: payload.email.toLowerCase() });
  if (existing) {
    throw new AppError('Email already registered', 409, { code: 'EMAIL_EXISTS' });
  }

  const passwordHash = await hashPassword(payload.password);

  const user = await withTransaction(async (session) => {
    const createdUser = await createWithSession(
      User,
      {
        email: payload.email.toLowerCase(),
        passwordHash,
        name: payload.name,
        roles: [USER_ROLES.BUYER],
        phone: payload.phone || null,
        country: payload.country || null,
        timezone: payload.timezone || 'UTC',
        status: UserStatusEnum.Active,
        verificationStatus: VerificationStatusEnum.Unverified,
        emailVerified: false,
      },
      session,
    );

    await createWithSession(
      BuyerProfile,
      {
        user: createdUser._id,
        username: payload.username || null,
        phone: payload.phone || null,
        country: payload.country || null,
        avatar: payload.avatar || null,
      },
      session,
    );

    await logActivity({
      userId: createdUser._id,
      action: 'auth.buyer.register',
      resource: 'User',
      resourceId: createdUser._id,
      ip: meta.ip,
      userAgent: meta.userAgent,
      session,
    });

    return createdUser;
  });

  const verification = await createEmailVerification(user);
  const tokens = await issueTokenPair(user, meta);
  await sendTemplatedEmail('registration', {
    to: user.email,
    data: { name: user.name },
  }).catch(() => null);

  return {
    user: publicUser(user),
    ...tokens,
    emailVerification: {
      sent: true,
      expiresAt: verification.expiresAt,
      ...(env.isProduction ? {} : { token: verification.token, verifyUrl: verification.verifyUrl }),
    },
  };
}

export async function registerSeller(payload, meta = {}) {
  const feeInfo = await getSellerRegistrationFee();
  if (!feeInfo.isEnabled) {
    throw new AppError('Seller registration is currently disabled', 403, {
      code: 'SELLER_REGISTRATION_DISABLED',
    });
  }

  // Fee is configurable in MongoDB. Payment is NOT implemented — free when fee is 0.
  const registrationFee = feeInfo.sellerRegistrationFee;
  const email = payload.email.toLowerCase();

  // Prefer explicit username; derive from legacy `name` when needed.
  let usernameRaw = payload.username || '';
  if (!usernameRaw && payload.name) {
    const direct = normalizeUsername(payload.name);
    usernameRaw = direct.ok ? direct.username : toSlug(payload.name);
  }
  const usernameResult = normalizeUsername(usernameRaw);
  if (!usernameResult.ok) {
    throw new AppError(usernameResult.message, 400, { code: usernameResult.code });
  }
  const username = usernameResult.username;

  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    throw new AppError('Username is already taken', 409, { code: 'USERNAME_EXISTS' });
  }
  const existingBuyerUsername = await BuyerProfile.findOne({ username });
  if (existingBuyerUsername) {
    throw new AppError('Username is already taken', 409, { code: 'USERNAME_EXISTS' });
  }

  const existingUser = await User.findOne({ email }).select('+passwordHash');

  if (existingUser) {
    const valid = await comparePassword(payload.password, existingUser.passwordHash);
    if (!valid) {
      throw new AppError('Invalid credentials for existing account', 401, {
        code: 'INVALID_CREDENTIALS',
      });
    }
  }

  const { user, seller } = await withTransaction(async (session) => {
    let userDoc = existingUser;

    if (!userDoc) {
      const passwordHash = await hashPassword(payload.password);
      userDoc = await createWithSession(
        User,
        {
          email,
          passwordHash,
          name: username,
          username,
          roles: [USER_ROLES.BUYER, USER_ROLES.SELLER],
          phone: payload.phone || null,
          country: payload.country || null,
          timezone: payload.timezone || 'UTC',
          status: UserStatusEnum.Active,
          verificationStatus: VerificationStatusEnum.Unverified,
        },
        session,
      );

      await createWithSession(
        BuyerProfile,
        {
          user: userDoc._id,
          username,
          phone: payload.phone || null,
          country: payload.country || null,
        },
        session,
      );
    } else {
      if (!userDoc.roles.includes(USER_ROLES.SELLER)) {
        userDoc.roles = [...new Set([...userDoc.roles, USER_ROLES.SELLER])];
      }
      if (!userDoc.username) {
        userDoc.username = username;
        userDoc.name = userDoc.name || username;
      }
      await userDoc.save(session ? { session } : undefined);

      const existingSellerQuery = SellerProfile.findOne({ user: userDoc._id });
      const existingSeller = session
        ? await existingSellerQuery.session(session)
        : await existingSellerQuery;
      if (existingSeller) {
        throw new AppError('Seller profile already exists', 409, {
          code: 'SELLER_EXISTS',
        });
      }

      const buyerQuery = BuyerProfile.findOne({ user: userDoc._id });
      const buyer = session ? await buyerQuery.session(session) : await buyerQuery;
      if (buyer && !buyer.username) {
        buyer.username = username;
        await buyer.save(session ? { session } : undefined);
      }
    }

    // New registrations derive store slug from username (existing sellers keep prior slugs).
    const baseSlug = usernameToSlug(payload.storeSlug || username)
      || toSlug(payload.storeName);
    if (!baseSlug) {
      throw new AppError('Username must produce a valid store URL', 400, {
        code: 'USERNAME_INVALID',
      });
    }
    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      const slugQuery = SellerProfile.findOne({ slug });
      // eslint-disable-next-line no-await-in-loop
      const clash = session ? await slugQuery.session(session) : await slugQuery;
      if (!clash) break;
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }

    const sellerDoc = await createWithSession(
      SellerProfile,
      {
        user: userDoc._id,
        storeName: payload.storeName,
        slug,
        ownerName: username,
        email,
        phone: payload.phone || null,
        country: payload.country || null,
        timezone: payload.timezone || 'UTC',
        bio: payload.bio || '',
        specialty: payload.specialty || null,
        withdrawalWallets: payload.withdrawalWallets || [],
      },
      session,
    );

    await logActivity({
      userId: userDoc._id,
      action: 'auth.seller.register',
      resource: 'SellerProfile',
      resourceId: sellerDoc._id,
      ip: meta.ip,
      userAgent: meta.userAgent,
      meta: {
        sellerRegistrationFee: registrationFee,
        currency: feeInfo.currency,
        username,
      },
      session,
    });

    return { user: userDoc, seller: sellerDoc };
  });

  const fresh = await User.findById(user._id);
  const verification = await createEmailVerification(fresh);
  const tokens = await issueTokenPair(fresh, meta);

  return {
    user: publicUser(fresh),
    seller,
    registration: {
      fee: registrationFee,
      currency: feeInfo.currency,
      paymentRequired: registrationFee > 0,
      note: registrationFee > 0
        ? 'Seller registration fee is configured but payment is not implemented in this phase.'
        : 'Seller registration is free.',
    },
    ...tokens,
    emailVerification: {
      sent: true,
      expiresAt: verification.expiresAt,
      ...(env.isProduction ? {} : { token: verification.token, verifyUrl: verification.verifyUrl }),
    },
  };
}

async function loginWithRoleCheck(email, password, rolePredicate, meta, failureCode) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid email or password', 401, { code: failureCode });
  }

  if (
    user.status === UserStatusEnum.Suspended
    || user.status === UserStatusEnum.Deleted
    || user.status === UserStatusEnum.Inactive
  ) {
    throw new AppError('Account is not active', 403, { code: 'ACCOUNT_INACTIVE' });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid email or password', 401, { code: failureCode });
  }

  if (!rolePredicate(user.roles || [])) {
    throw new AppError('Forbidden for this login portal', 403, { code: 'ROLE_MISMATCH' });
  }

  user.lastLoginAt = new Date();
  user.lastLoginIp = meta.ip || null;
  await user.save();

  await logActivity({
    userId: user._id,
    action: 'auth.login',
    resource: 'User',
    resourceId: user._id,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  const tokens = await issueTokenPair(user, meta);
  return { user: publicUser(user), ...tokens };
}

export async function loginBuyer(payload, meta = {}) {
  return loginWithRoleCheck(
    payload.email,
    payload.password,
    (roles) => roles.includes(USER_ROLES.BUYER) || roles.includes(USER_ROLES.SELLER),
    meta,
    'INVALID_CREDENTIALS',
  );
}

export async function loginSeller(payload, meta = {}) {
  const result = await loginWithRoleCheck(
    payload.email,
    payload.password,
    (roles) => roles.includes(USER_ROLES.SELLER),
    meta,
    'INVALID_CREDENTIALS',
  );

  const seller = await SellerProfile.findOne({ user: result.user.id }).lean();
  return { ...result, seller };
}

export async function loginAdmin(payload, meta = {}) {
  return loginWithRoleCheck(
    payload.email,
    payload.password,
    (roles) => roles.some((role) => ADMIN_LOGIN_ROLES.includes(role)),
    meta,
    'INVALID_CREDENTIALS',
  );
}

export async function logout(refreshToken) {
  if (!refreshToken) {
    return { revoked: false };
  }

  const tokenHash = hashToken(refreshToken);
  const updated = await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date() } },
    { new: true },
  );

  return { revoked: Boolean(updated) };
}

export async function refreshSession(refreshToken, meta = {}) {
  if (!refreshToken) {
    throw new AppError('Refresh token required', 401, { code: 'REFRESH_REQUIRED' });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid refresh token', 401, { code: 'INVALID_REFRESH_TOKEN' });
  }

  const tokenHash = hashToken(refreshToken);
  const existing = await RefreshToken.findOne({ tokenHash });
  if (!existing) {
    throw new AppError('Refresh token expired or revoked', 401, {
      code: 'REFRESH_EXPIRED',
    });
  }

  // Reuse of an already-rotated/revoked refresh token → revoke all sessions
  if (existing.revokedAt) {
    await RefreshToken.updateMany(
      { user: existing.user, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    throw new AppError('Refresh token reuse detected — all sessions revoked', 401, {
      code: 'REFRESH_REUSE',
    });
  }

  if (existing.expiresAt.getTime() < Date.now()) {
    throw new AppError('Refresh token expired or revoked', 401, {
      code: 'REFRESH_EXPIRED',
    });
  }

  const user = await User.findById(decoded.sub || existing.user);
  if (!user || user.status !== UserStatusEnum.Active) {
    throw new AppError('User not found or inactive', 401, { code: 'UNAUTHORIZED' });
  }

  // Atomic rotate — prevent concurrent double-issue races
  const stored = await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date() } },
    { new: true },
  );
  if (!stored) {
    throw new AppError('Refresh token expired or revoked', 401, {
      code: 'REFRESH_EXPIRED',
    });
  }

  const tokens = await issueTokenPair(user, meta);
  await RefreshToken.updateOne(
    { _id: stored._id },
    { $set: { replacedByTokenHash: hashToken(tokens.refreshToken) } },
  );

  return { user: publicUser(user), ...tokens };
}

export async function forgotPassword(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    throw new AppError('A valid email address is required', 400, {
      code: 'INVALID_EMAIL',
    });
  }

  const user = await User.findOne({ email: normalized });
  // Always return success for unknown emails to avoid account enumeration.
  if (!user) {
    logger.info('Password reset requested for unknown email', {
      emailDomain: normalized.split('@')[1] || null,
    });
    return { sent: true };
  }

  // Invalidate any previous unused reset tokens (single active token).
  await PasswordResetToken.updateMany(
    { user: user._id, usedAt: null },
    { $set: { usedAt: new Date() } },
  );

  const raw = generateOpaqueToken(32);
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await PasswordResetToken.create({
    user: user._id,
    tokenHash,
    expiresAt,
  });

  const frontendBase = String(env.FRONTEND_URL || env.APP_URL || '').replace(/\/$/, '');
  const resetUrl = `${frontendBase}/reset-password?token=${encodeURIComponent(raw)}`;

  logger.info('Password reset token created', {
    userId: String(user._id),
    roles: user.roles,
    expiresAt,
  });

  // If SMTP fails / is missing, surface a real error for existing accounts.
  const emailResult = await sendTemplatedEmail('password_reset', {
    to: user.email,
    data: {
      name: user.name,
      resetUrl,
      expiresInMinutes: 60,
    },
  });

  logger.info('Password reset email dispatch result', {
    userId: String(user._id),
    sent: emailResult.sent,
    provider: emailResult.provider,
    messageId: emailResult.messageId || null,
  });

  return {
    sent: true,
    emailDelivered: Boolean(emailResult.sent),
    ...(env.isProduction ? {} : { token: raw, resetUrl, expiresAt }),
  };
}

export async function resetPassword({ token, password }) {
  if (!token || !String(token).trim()) {
    throw new AppError('Invalid or expired reset token', 400, {
      code: 'INVALID_RESET_TOKEN',
    });
  }

  const tokenHash = hashToken(String(token).trim());
  const record = await PasswordResetToken.findOne({ tokenHash, usedAt: null });
  if (!record || record.expiresAt.getTime() < Date.now()) {
    logger.warn('Password reset rejected: invalid or expired token');
    throw new AppError('Invalid or expired reset token', 400, {
      code: 'INVALID_RESET_TOKEN',
    });
  }

  const user = await User.findById(record.user).select('+passwordHash');
  if (!user) {
    throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
  }

  user.passwordHash = await hashPassword(password);
  // Invited staff become active once they set their first password.
  if (user.status === UserStatusEnum.Invited || user.status === UserStatusEnum.Pending) {
    user.status = UserStatusEnum.Active;
  }
  if (!user.emailVerified) {
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
  }
  await user.save();

  // Mark this token used and burn any other outstanding tokens for the user.
  record.usedAt = new Date();
  await record.save();
  await PasswordResetToken.updateMany(
    { user: user._id, usedAt: null, _id: { $ne: record._id } },
    { $set: { usedAt: new Date() } },
  );

  await RefreshToken.updateMany(
    { user: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );

  await logActivity({
    userId: user._id,
    action: 'auth.password.reset',
    resource: 'User',
    resourceId: user._id,
  });

  logger.info('Password reset completed', {
    userId: String(user._id),
    roles: user.roles,
  });

  return { reset: true };
}

export async function verifyEmail(token) {
  const tokenHash = hashToken(token);
  const record = await EmailVerificationToken.findOne({ tokenHash, usedAt: null });
  if (!record || record.expiresAt.getTime() < Date.now()) {
    throw new AppError('Invalid or expired verification token', 400, {
      code: 'INVALID_VERIFICATION_TOKEN',
    });
  }

  const user = await User.findById(record.user);
  if (!user) {
    throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
  }

  user.emailVerified = true;
  user.emailVerifiedAt = new Date();
  if (user.verificationStatus === VerificationStatusEnum.Unverified) {
    user.verificationStatus = VerificationStatusEnum.Verified;
  }
  await user.save();

  record.usedAt = new Date();
  await record.save();

  await logActivity({
    userId: user._id,
    action: 'auth.email.verified',
    resource: 'User',
    resourceId: user._id,
  });

  return { user: publicUser(user) };
}

export async function getMe(userId) {
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

export function setRefreshCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.COOKIE_SECURE || env.isProduction,
    sameSite: env.COOKIE_SAME_SITE,
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/',
    maxAge: parseDurationToMs(jwtConfig.refreshExpiresIn),
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.COOKIE_SECURE || env.isProduction,
    sameSite: env.COOKIE_SAME_SITE,
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/',
  });
}

/**
 * Google OAuth login / register / link.
 * - Existing googleId → login
 * - Existing email without googleId → link googleId and login
 * - New email → create buyer account (emailVerified=true)
 */
export async function loginOrRegisterWithGoogle(profile, meta = {}) {
  if (!env.googleOAuthConfigured) {
    throw new AppError('Google sign-in is not configured', 503, {
      code: 'GOOGLE_OAUTH_NOT_CONFIGURED',
    });
  }

  const googleId = profile.id || profile.googleId;
  const email = String(profile.email || profile.emails?.[0]?.value || '').toLowerCase().trim();
  const name = profile.displayName
    || profile.name
    || [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ')
    || (email ? email.split('@')[0] : 'Google User');
  const avatar = profile.photos?.[0]?.value || profile.picture || null;

  if (!googleId || !email) {
    throw new AppError('Google profile is incomplete', 400, { code: 'GOOGLE_PROFILE_INVALID' });
  }

  let user = await User.findOne({ googleId }).select('+passwordHash');
  let linked = false;
  let created = false;

  if (!user) {
    user = await User.findOne({ email }).select('+passwordHash');
    if (user) {
      if (user.googleId && user.googleId !== googleId) {
        throw new AppError('This email is linked to a different Google account', 409, {
          code: 'GOOGLE_ID_CONFLICT',
        });
      }
      user.googleId = googleId;
      user.authProvider = user.authProvider === 'local' ? 'local' : 'google';
      if (!user.roles?.includes(USER_ROLES.BUYER)) {
        user.roles = [...(user.roles || []), USER_ROLES.BUYER];
      }
      if (!user.emailVerified) {
        user.emailVerified = true;
        user.emailVerifiedAt = new Date();
        user.verificationStatus = VerificationStatusEnum.Verified;
      }
      if (!user.avatar && avatar) user.avatar = avatar;
      await user.save();
      linked = true;
    }
  }

  if (!user) {
    const randomPassword = generateOpaqueToken(32);
    const passwordHash = await hashPassword(randomPassword);
    user = await withTransaction(async (session) => {
      const createdUser = await createWithSession(
        User,
        {
          email,
          passwordHash,
          name: String(name).slice(0, 120),
          roles: [USER_ROLES.BUYER],
          avatar,
          googleId,
          authProvider: 'google',
          status: UserStatusEnum.Active,
          verificationStatus: VerificationStatusEnum.Verified,
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
        session,
      );

      await createWithSession(
        BuyerProfile,
        {
          user: createdUser._id,
          avatar: avatar || null,
        },
        session,
      );

      await logActivity({
        userId: createdUser._id,
        action: 'auth.google.register',
        resource: 'User',
        resourceId: createdUser._id,
        ip: meta.ip,
        userAgent: meta.userAgent,
        session,
      });

      return createdUser;
    });
    created = true;
  }

  if (user.status && user.status !== UserStatusEnum.Active) {
    throw new AppError('Account is not active', 403, { code: 'ACCOUNT_INACTIVE' });
  }

  user.lastLoginAt = new Date();
  user.lastLoginIp = meta.ip || null;
  await user.save();

  if (!created) {
    await logActivity({
      userId: user._id,
      action: linked ? 'auth.google.link_login' : 'auth.google.login',
      resource: 'User',
      resourceId: user._id,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
  }

  // Ensure buyer profile exists for Google accounts
  const buyer = await BuyerProfile.findOne({ user: user._id });
  if (!buyer) {
    await BuyerProfile.create({ user: user._id, avatar: avatar || null });
  }

  const tokens = await issueTokenPair(user, meta);
  return {
    user: publicUser(user),
    ...tokens,
    created,
    linked,
  };
}

export { REFRESH_COOKIE_NAME, publicUser };

export default {
  registerBuyer,
  registerSeller,
  loginBuyer,
  loginSeller,
  loginAdmin,
  logout,
  refreshSession,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getMe,
  loginOrRegisterWithGoogle,
  setRefreshCookie,
  clearRefreshCookie,
  REFRESH_COOKIE_NAME,
};
