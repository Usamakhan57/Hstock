import { env } from './env.js';

/**
 * JWT configuration.
 * Secrets are loaded from environment variables only.
 */
export const jwtConfig = {
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
};

export default jwtConfig;
