import { AppError } from '../utils/AppError.js';
import { resolvePermissions } from '../constants/permissions.js';

/**
 * Require one or more permissions (OR logic).
 * @param {...string} requiredPermissions
 */
export function requirePermission(...requiredPermissions) {
  return (req, _res, next) => {
    if (!req.user) {
      next(
        new AppError('Authentication required', 401, {
          code: 'UNAUTHORIZED',
        }),
      );
      return;
    }

    const roles = Array.isArray(req.user.roles)
      ? req.user.roles
      : [req.user.role].filter(Boolean);

    const granted = new Set(
      req.user.permissions?.length
        ? req.user.permissions
        : resolvePermissions(roles),
    );

    const allowed = requiredPermissions.some((permission) => granted.has(permission));

    if (!allowed) {
      next(
        new AppError('Forbidden — missing permission', 403, {
          code: 'FORBIDDEN_PERMISSION',
          details: { requiredPermissions },
        }),
      );
      return;
    }

    next();
  };
}

export default requirePermission;
