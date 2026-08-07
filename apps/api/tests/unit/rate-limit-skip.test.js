import '../helpers/env-bootstrap.js';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shouldSkipGlobalRateLimit } from '../../src/middlewares/rateLimit.middleware.js';

describe('global rate limit skip', () => {
  it('skips public CMS GETs and version polling', () => {
    assert.equal(shouldSkipGlobalRateLimit({ method: 'GET', path: '/api/v1/cms/versions' }), true);
    assert.equal(shouldSkipGlobalRateLimit({ method: 'GET', path: '/api/v1/cms/homepage' }), true);
    assert.equal(shouldSkipGlobalRateLimit({ method: 'GET', path: '/api/v1/cms' }), true);
    assert.equal(shouldSkipGlobalRateLimit({ method: 'HEAD', path: '/api/v1/cms/popular_tags' }), true);
  });

  it('skips health and OPTIONS', () => {
    assert.equal(shouldSkipGlobalRateLimit({ method: 'GET', path: '/health/ready' }), true);
    assert.equal(shouldSkipGlobalRateLimit({ method: 'OPTIONS', path: '/api/v1/products' }), true);
  });

  it('still rate-limits mutating and non-CMS reads', () => {
    assert.equal(shouldSkipGlobalRateLimit({ method: 'PUT', path: '/api/v1/cms/homepage' }), false);
    assert.equal(shouldSkipGlobalRateLimit({ method: 'POST', path: '/api/v1/auth/login' }), false);
    assert.equal(shouldSkipGlobalRateLimit({ method: 'GET', path: '/api/v1/products' }), false);
  });
});
