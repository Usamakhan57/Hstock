import crypto from 'node:crypto';

/**
 * Short-lived OAuth authorization-code → redirect result cache.
 * Prevents Android Chrome→PWA double-hit of the same Google code from
 * surfacing a raw JSON "Internal server error" (invalid_grant) in the app.
 */
const CODE_TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 500;
const cache = new Map();

function prune() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

export function hashOAuthCode(code) {
  if (!code) return null;
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

export function getCachedGoogleOAuthResult(code) {
  prune();
  const key = hashOAuthCode(code);
  if (!key) return null;
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.result;
}

export function setCachedGoogleOAuthResult(code, result) {
  prune();
  const key = hashOAuthCode(code);
  if (!key || !result) return;
  cache.set(key, {
    result,
    expiresAt: Date.now() + CODE_TTL_MS,
  });
}

export function clearGoogleOAuthCache() {
  cache.clear();
}

export default {
  hashOAuthCode,
  getCachedGoogleOAuthResult,
  setCachedGoogleOAuthResult,
  clearGoogleOAuthCache,
};
