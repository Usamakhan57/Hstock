/**
 * In-flight request deduplication + short-lived response cache for GET-style
 * catalog calls. Keeps Rapid Filter/Sort/Pagination transitions snappy without
 * hammering the API with identical concurrent requests.
 */

const DEFAULT_TTL_MS = 5_000;

const inflight = new Map();
const cache = new Map();

export function cacheKey(namespace, params = {}) {
  return `${namespace}:${JSON.stringify(params)}`;
}

export async function cachedRequest(key, fetcher, ttlMs = DEFAULT_TTL_MS) {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) {
    return hit.value;
  }

  if (inflight.has(key)) {
    return inflight.get(key);
  }

  const promise = Promise.resolve()
    .then(fetcher)
    .then((value) => {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

export function clearRequestCache(prefix) {
  if (!prefix) {
    cache.clear();
    inflight.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
  for (const key of inflight.keys()) {
    if (key.startsWith(prefix)) inflight.delete(key);
  }
}

export default {
  cacheKey,
  cachedRequest,
  clearRequestCache,
};
