import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cacheKey, cachedRequest, clearRequestCache } from './requestCache';

describe('requestCache', () => {
  beforeEach(() => {
    clearRequestCache();
  });

  it('builds stable cache keys', () => {
    expect(cacheKey('products', { page: 1, limit: 20 })).toBe(cacheKey('products', { page: 1, limit: 20 }));
    expect(cacheKey('products', { page: 1 })).not.toBe(cacheKey('products', { page: 2 }));
  });

  it('deduplicates in-flight requests', async () => {
    const fetcher = vi.fn(async () => ({ ok: true }));
    const a = cachedRequest('k1', fetcher);
    const b = cachedRequest('k1', fetcher);
    await Promise.all([a, b]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('returns cached value within TTL', async () => {
    const fetcher = vi.fn(async () => 42);
    await expect(cachedRequest('k2', fetcher, 10_000)).resolves.toBe(42);
    await expect(cachedRequest('k2', fetcher, 10_000)).resolves.toBe(42);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
