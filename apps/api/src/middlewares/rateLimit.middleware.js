import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/**
 * Public read endpoints that an SPA hits repeatedly (CMS poller, health,
 * catalog). Counting these against the global limit makes shared Wi-Fi / CGNAT
 * IPs look like the site is "hung" once the SPA's parallel CMS fan-out +
 * /cms/versions poller burn the budget.
 */
export function shouldSkipGlobalRateLimit(req) {
  const method = String(req.method || 'GET').toUpperCase();
  if (method === 'OPTIONS') return true;

  if (method !== 'GET' && method !== 'HEAD') return false;

  const path = String(req.path || '');
  if (path === '/health' || path.startsWith('/health/')) return true;
  if (path === '/uploads' || path.startsWith('/uploads/')) return true;
  if (path === '/api/v1/cms' || path.startsWith('/api/v1/cms/')) return true;
  return false;
}

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipGlobalRateLimit,
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

/** Per-IP limiter for dispute chat message endpoints (spam protection). */
export const disputeChatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.isProduction ? 20 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many chat messages, please try again later.',
    data: null,
    errors: null,
    meta: null,
    code: 'CHAT_RATE_LIMITED',
  },
});

export default globalRateLimiter;
