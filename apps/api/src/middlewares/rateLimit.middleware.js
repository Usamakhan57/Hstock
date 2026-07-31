import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    data: null,
    errors: null,
    meta: null,
    code: 'RATE_LIMITED',
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProduction ? 30 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    data: null,
    errors: null,
    meta: null,
    code: 'AUTH_RATE_LIMITED',
  },
});

export default globalRateLimiter;
