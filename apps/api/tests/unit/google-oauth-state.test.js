import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import '../helpers/env-bootstrap.js';
import {
  decodeOAuthState,
  encodeOAuthState,
  resolveOAuthLandingPath,
} from '../../src/controllers/auth/googleOAuth.controller.js';
import {
  clearGoogleOAuthCache,
  getCachedGoogleOAuthResult,
  setCachedGoogleOAuthResult,
} from '../../src/utils/googleOAuthCache.js';

describe('google oauth helpers', () => {
  beforeEach(() => {
    clearGoogleOAuthCache();
  });

  it('oauth state round-trips intent, returnTo, and optional store fields', () => {
    const encoded = encodeOAuthState({
      intent: 'seller',
      returnTo: '/seller/dashboard',
      storeName: 'Studio Lume',
      username: 'studio_lume',
    });
    const decoded = decodeOAuthState(encoded);
    assert.equal(decoded.intent, 'seller');
    assert.equal(decoded.returnTo, '/seller/dashboard');
    assert.equal(decoded.storeName, 'Studio Lume');
    assert.equal(decoded.username, 'studio_lume');
  });

  it('oauth state falls back safely for invalid payloads', () => {
    const decoded = decodeOAuthState('!!!not-valid!!!');
    assert.equal(decoded.intent, 'buyer');
    assert.equal(decoded.returnTo, '');
    assert.equal(decoded.storeName, '');
    assert.equal(decoded.username, '');
  });

  it('oauth code cache is idempotent for android double-hit', () => {
    setCachedGoogleOAuthResult('auth-code-1', {
      redirectUrl: 'https://example.com/auth/google/callback?google=success&accessToken=x',
    });
    const first = getCachedGoogleOAuthResult('auth-code-1');
    const second = getCachedGoogleOAuthResult('auth-code-1');
    assert.equal(first.redirectUrl, second.redirectUrl);
  });

  it('resolveOAuthLandingPath never sends buyers to seller portal', () => {
    assert.equal(
      resolveOAuthLandingPath({
        intent: 'seller',
        returnTo: '/seller/dashboard',
        roles: ['buyer'],
      }),
      '/dashboard',
    );
    assert.equal(
      resolveOAuthLandingPath({
        intent: 'seller',
        returnTo: '/seller/dashboard',
        roles: ['buyer', 'seller'],
      }),
      '/seller/dashboard',
    );
    assert.equal(
      resolveOAuthLandingPath({
        intent: 'buyer',
        returnTo: '',
        roles: ['buyer'],
      }),
      '/dashboard',
    );
  });
});
