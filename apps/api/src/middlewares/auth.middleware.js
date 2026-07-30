import { AppError } from '../utils/AppError.js';

/**
 * Authentication middleware placeholder.
 * Phase 2 will verify JWT access tokens and attach req.user.
 */
export function authenticate(_req, _res, next) {
  next(
    new AppError('Authentication is not implemented in Phase 1', 501, {
      code: 'AUTH_NOT_IMPLEMENTED',
    }),
  );
}

/**
 * Optional auth placeholder — passes through until Phase 2.
 */
export function optionalAuthenticate(_req, _res, next) {
  next();
}

export default {
  authenticate,
  optionalAuthenticate,
};
