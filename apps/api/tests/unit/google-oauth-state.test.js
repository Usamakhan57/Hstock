import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import '../helpers/env-bootstrap.js';
import {
  decodeOAuthState,
  encodeOAuthState,
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

  it('oauth state round-trips intent and returnTo', () => {
    const encoded = encodeOAuthState({ intent: 'seller', returnTo: '/seller/dashboard' });
    const decoded = decodeOAuthState(encoded);
    assert.equal(decoded.intent, 'seller');
    assert.equal(decoded.returnTo, '/seller/dashboard');
  });

  it('oauth state falls back safely for invalid payloads', () => {
    const decoded = decodeOAuthState('!!!not-valid!!!');
    assert.equal(decoded.intent, 'buyer');
    assert.equal(decoded.returnTo, '');
  });

  it('oauth code cache is idempotent for android double-hit', () => {
    setCachedGoogleOAuthResult('auth-code-1', {
      redirectUrl: 'https://example.com/auth/google/callback?google=success&accessToken=x',
    });
    const first = getCachedGoogleOAuthResult('auth-code-1');
    const second = getCachedGoogleOAuthResult('auth-code-1');
    assert.equal(first.redirectUrl, second.redirectUrl);
  });
});
