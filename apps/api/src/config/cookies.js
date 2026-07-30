import { env } from './env.js';

export const cookieConfig = {
  httpOnly: true,
  secure: env.COOKIE_SECURE || env.isProduction,
  sameSite: env.COOKIE_SAME_SITE,
  domain: env.COOKIE_DOMAIN || undefined,
  path: '/',
};

export const refreshCookieOptions = {
  ...cookieConfig,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export default cookieConfig;
