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

function encodeOAuthState({ intent = 'buyer', returnTo = '' } = {}) {
  const payload = {
    intent: ['buyer', 'seller', 'admin'].includes(intent) ? intent : 'buyer',
    returnTo: String(returnTo || '').slice(0, 200),
    n: Date.now().toString(36),
  };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export { encodeOAuthState };

export function decodeOAuthState(raw) {
  if (!raw) return { intent: 'buyer', returnTo: '' };
  try {
    const parsed = JSON.parse(Buffer.from(String(raw), 'base64url').toString('utf8'));
    return {
      intent: ['buyer', 'seller', 'admin'].includes(parsed?.intent) ? parsed.intent : 'buyer',
      returnTo: typeof parsed?.returnTo === 'string' ? parsed.returnTo.slice(0, 200) : '',
    };
  } catch {
    return { intent: 'buyer', returnTo: '' };
  }
}

function homeForIntent(intent, roles = []) {
  if (intent === 'admin' || roles.some((r) => ['admin', 'super_admin'].includes(r))) {
    return '/admin';
  }
  if (intent === 'seller' || roles.includes('seller')) {
    return '/seller/dashboard';
  }
  return '/dashboard';
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
  const state = encodeOAuthState({ intent, returnTo });

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

      const result = await authService.loginOrRegisterWithGoogle(user, requestMeta(req));
      authService.setRefreshCookie(res, result.refreshToken);

      const roles = result.user?.roles || [];
      const home = homeForIntent(stateInfo.intent, roles);
      const returnTo = stateInfo.returnTo && stateInfo.returnTo.startsWith('/')
        ? stateInfo.returnTo
        : home;

      const params = new URLSearchParams({
        google: 'success',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        created: result.created ? '1' : '0',
        linked: result.linked ? '1' : '0',
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
};
