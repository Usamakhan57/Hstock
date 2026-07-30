import { AppError } from '../utils/AppError.js';
import { USER_ROLE_VALUES } from '../constants/roles.js';

/**
 * Role authorization middleware placeholder.
 * Phase 2 will enforce roles from req.user after authentication.
 * @param {...string} allowedRoles
 */
export function authorize(...allowedRoles) {
  const roles = allowedRoles.length ? allowedRoles : USER_ROLE_VALUES;

  return (req, _res, next) => {
    if (!req.user) {
      next(
        new AppError('Authentication required', 401, {
          code: 'UNAUTHORIZED',
        }),
      );
      return;
    }

    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.role];
    const permitted = roles.some((role) => userRoles?.includes(role));

    if (!permitted) {
      next(
        new AppError('Forbidden', 403, {
          code: 'FORBIDDEN',
          details: { requiredRoles: roles },
        }),
      );
      return;
    }

    next();
  };
}

export default authorize;
