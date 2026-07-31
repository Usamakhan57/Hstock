import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/token.js';
import { User } from '../models/index.js';
import { resolvePermissions } from '../constants/permissions.js';
import { UserStatusEnum } from '../constants/enums.js';

function extractAccessToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (header && typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  return null;
}

/**
 * Require a valid JWT access token and attach req.user.
 */
export async function authenticate(req, _res, next) {
  try {
    const token = extractAccessToken(req);
    if (!token) {
      next(
        new AppError('Authentication required', 401, {
          code: 'UNAUTHORIZED',
        }),
      );
      return;
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      next(
        new AppError('Invalid or expired access token', 401, {
          code: 'INVALID_TOKEN',
        }),
      );
      return;
    }

    const user = await User.findById(decoded.sub || decoded.id);
    if (!user || user.status === UserStatusEnum.Deleted) {
      next(
        new AppError('User not found', 401, {
          code: 'UNAUTHORIZED',
        }),
      );
      return;
    }

    if (user.status === UserStatusEnum.Suspended || user.status === UserStatusEnum.Inactive) {
      next(
        new AppError(
          user.status === UserStatusEnum.Inactive ? 'Account inactive' : 'Account suspended',
          403,
          {
            code: user.status === UserStatusEnum.Inactive
              ? 'ACCOUNT_INACTIVE'
              : 'ACCOUNT_SUSPENDED',
          },
        ),
      );
      return;
    }

    const roles = user.roles || [];
    req.user = {
      id: String(user._id),
      _id: user._id,
      email: user.email,
      name: user.name,
      roles,
      permissions: resolvePermissions(roles),
      status: user.status,
      emailVerified: user.emailVerified,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional auth — attaches req.user when a valid token is present.
 */
export async function optionalAuthenticate(req, _res, next) {
  try {
    const token = extractAccessToken(req);
    if (!token) {
      next();
      return;
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      next();
      return;
    }

    const user = await User.findById(decoded.sub || decoded.id);
    if (user && user.status === UserStatusEnum.Active) {
      const roles = user.roles || [];
      req.user = {
        id: String(user._id),
        _id: user._id,
        email: user.email,
        name: user.name,
        roles,
        permissions: resolvePermissions(roles),
        status: user.status,
        emailVerified: user.emailVerified,
      };
    }

    next();
  } catch (error) {
    next(error);
  }
}

/** Alias matching the Phase 2 API naming. */
export const requireAuth = authenticate;

export default {
  authenticate,
  optionalAuthenticate,
  requireAuth,
};
