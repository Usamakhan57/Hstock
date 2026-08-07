import passport from 'passport';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import * as authService from '../../services/auth.service.js';
import {
  getCachedGoogleOAuthResult,
  setCachedGoogleOAuthResult,
} from '../../utils/googleOAuthCache.js';

function frontendBase() {
  return (env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function safeReason(value, fallback = 'google_auth_failed') {
  const raw = String(value || fallback).slice(0, 120);
  return encodeURIComponent(raw.replace(/[^\w.\- ]+/g, '_'));
}

function encodeOAuthState({ intent = 'buyer', returnTo = '', storeName = '', username = '' } = {}) {
  const payload = {
    intent: ['buyer', 'seller', 'admin'].includes(intent) ? intent : 'buyer',
    returnTo: String(returnTo || '').slice(0, 200),
    storeName: String(storeName || '').slice(0, 160),
    username: String(username || '').slice(0, 30),
    n: Date.now().toString(36),
  };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export { encodeOAuthState };

export function decodeOAuthState(raw) {
  if (!raw) return { intent: 'buyer', returnTo: '', storeName: '', username: '' };
  try {
    const parsed = JSON.parse(Buffer.from(String(raw), 'base64url').toString('utf8'));
    return {
      intent: ['buyer', 'seller', 'admin'].includes(parsed?.intent) ? parsed.intent : 'buyer',
      returnTo: typeof parsed?.returnTo === 'string' ? parsed.returnTo.slice(0, 200) : '',
      storeName: typeof parsed?.storeName === 'string' ? parsed.storeName.slice(0, 160) : '',
      username: typeof parsed?.username === 'string' ? parsed.username.slice(0, 30) : '',
    };
  } catch {
    return { intent: 'buyer', returnTo: '', storeName: '', username: '' };
  }
}

function homeForRoles(roles = []) {
  const list = Array.isArray(roles) ? roles : [];
  if (list.some((r) => ['admin', 'super_admin'].includes(r))) {
    return '/admin';
  }
  if (list.includes('seller')) {
    return '/seller/dashboard';
  }
  return '/dashboard';
}

/**
 * Resolve post-OAuth SPA path. Never send users to seller/admin portals
 * unless their JWT roles actually allow it (prevents 403 Access Denied).
 */
export function resolveOAuthLandingPath({ intent = 'buyer', returnTo = '', roles = [] } = {}) {
  const list = Array.isArray(roles) ? roles : [];
  const home = homeForRoles(list);

  const safeReturn = typeof returnTo === 'string'
    && returnTo.startsWith('/')
    && !returnTo.startsWith('//')
    ? returnTo
    : '';

  if (!safeReturn) {
    // Intent alone must not override missing roles.
    if (intent === 'seller' && list.includes('seller')) return '/seller/dashboard';
    if (intent === 'admin' && list.some((r) => ['admin', 'super_admin'].includes(r))) return '/admin';
    return home;
  }

  if (safeReturn.startsWith('/seller') && !list.includes('seller')) {
    return home;
  }
  if (safeReturn.startsWith('/admin') && !list.some((r) => ['admin', 'super_admin', 'editor', 'support'].includes(r))) {
    return home;
  }
  return safeReturn;
}

function redirectToFrontend(res, pathWithQuery) {
  return res.redirect(`${frontendBase()}${pathWithQuery}`);
}

function requestMeta(req) {
  return {
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  };
}

/**
 * Start Google OAuth. Always redirects for browser navigations — never JSON.
 */
export function startGoogleOAuth(req, res, next) {
  if (!env.googleOAuthConfigured) {
    return redirectToFrontend(res, '/login?google=error&reason=not_configured');
  }

  const intent = String(req.query.intent || 'buyer').toLowerCase();
  const returnTo = String(req.query.returnTo || '');
  const storeName = String(req.query.storeName || '');
  const username = String(req.query.username || '');
  const state = encodeOAuthState({ intent, returnTo, storeName, username });

  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account',
    state,
  })(req, res, next);
}

/**
 * Google OAuth callback.
 * - Never returns raw JSON to the browser (PWA-safe).
 * - Idempotent for reused authorization codes (Android Chrome→PWA double open).
 * - Redirects to the SPA callback page with tokens, or to /login on failure.
 */
export function handleGoogleOAuthCallback(req, res) {
  const frontend = frontendBase();
  const code = req.query?.code;
  const stateInfo = decodeOAuthState(req.query?.state);

  if (!env.googleOAuthConfigured) {
    return res.redirect(`${frontend}/login?google=error&reason=not_configured`);
  }

  // Replay of an already-exchanged code (common on Android PWA handoff).
  const cached = getCachedGoogleOAuthResult(code);
  if (cached?.redirectUrl) {
    return res.redirect(cached.redirectUrl);
  }

  return passport.authenticate('google', { session: false }, async (err, user, info) => {
    try {
      if (err) {
        logger.warn('Google OAuth passport error', {
          message: err.message,
          name: err.name,
          code: err.code,
        });
        // Still check cache in case a parallel request succeeded.
        const raced = getCachedGoogleOAuthResult(code);
        if (raced?.redirectUrl) return res.redirect(raced.redirectUrl);
        return res.redirect(
          `${frontend}/login?google=error&reason=${safeReason(err.code || err.message || 'oauth_error')}`,
        );
      }

      if (!user) {
        const reason = info?.message || 'denied';
        return res.redirect(`${frontend}/login?google=error&reason=${safeReason(reason, 'denied')}`);
      }

      const result = await authService.loginOrRegisterWithGoogle(user, requestMeta(req), {
        intent: stateInfo.intent,
        storeName: stateInfo.storeName || undefined,
        username: stateInfo.username || undefined,
      });
      authService.setRefreshCookie(res, result.refreshToken);

      const roles = result.user?.roles || [];
      const returnTo = resolveOAuthLandingPath({
        intent: stateInfo.intent,
        returnTo: stateInfo.returnTo,
        roles,
      });

      const params = new URLSearchParams({
        google: 'success',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        created: result.created ? '1' : '0',
        linked: result.linked ? '1' : '0',
        createdSeller: result.createdSeller ? '1' : '0',
        intent: stateInfo.intent || 'buyer',
        redirect: returnTo,
      });
      const redirectUrl = `${frontend}/auth/google/callback?${params.toString()}`;
      setCachedGoogleOAuthResult(code, { redirectUrl, at: Date.now() });
      return res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Google OAuth callback failed', { message: error.message });
      const raced = getCachedGoogleOAuthResult(code);
      if (raced?.redirectUrl) return res.redirect(raced.redirectUrl);
      return res.redirect(
        `${frontend}/login?google=error&reason=${safeReason(error.message || 'google_auth_failed')}`,
      );
    }
  })(req, res);
}

export default {
  startGoogleOAuth,
  handleGoogleOAuthCallback,
  encodeOAuthState,
  decodeOAuthState,
  resolveOAuthLandingPath,
};
