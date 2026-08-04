import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../lib/apiClient', () => ({
  get: vi.fn(),
  put: vi.fn(),
}));

vi.mock('../lib/requestCache', () => ({
  cachedRequest: (_key, fetcher) => fetcher(),
  clearRequestCache: vi.fn(),
  cacheKey: (ns, params) => `${ns}:${JSON.stringify(params)}`,
}));

import { get, put } from '../lib/apiClient';
import { cmsApi, CMS_KEYS, invalidateCmsClientCache } from './cmsApi';

describe('cmsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateCmsClientCache();
  });

  it('reads popular tags from /cms/popular_tags', async () => {
    get.mockResolvedValue({
      data: {
        key: CMS_KEYS.POPULAR_TAGS,
        data: {
          tags: [{ id: 'pt-gmail', label: 'Gmail Accounts', url: '/shop?search=Gmail', enabled: true, sortOrder: 1 }],
        },
        version: 1,
      },
    });

    const data = await cmsApi.get(CMS_KEYS.POPULAR_TAGS);
    expect(get).toHaveBeenCalledWith('/cms/popular_tags');
    expect(data.tags[0].label).toBe('Gmail Accounts');
    expect(data.tags[0].label).not.toBe('Adobe');
  });

  it('writes contact settings via PUT and returns updated data', async () => {
    put.mockResolvedValue({
      data: {
        key: CMS_KEYS.CONTACT,
        data: { email: 'hello@apnastore.org', phone: '+1 555-0100' },
        version: 2,
      },
    });

    const data = await cmsApi.update(CMS_KEYS.CONTACT, {
      email: 'hello@apnastore.org',
      phone: '+1 555-0100',
    });

    expect(put).toHaveBeenCalledWith('/cms/contact', {
      data: { email: 'hello@apnastore.org', phone: '+1 555-0100' },
    });
    expect(data.email).toBe('hello@apnastore.org');
  });
});
