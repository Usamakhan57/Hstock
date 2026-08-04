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
import { clearRequestCache } from '../lib/requestCache';
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

  it('reads admin documents from /cms/admin/:key', async () => {
    get.mockResolvedValue({
      data: {
        key: CMS_KEYS.EMAIL_TEMPLATES,
        data: { items: [{ id: 'email-welcome' }] },
        version: 1,
      },
    });

    const data = await cmsApi.getAdmin(CMS_KEYS.EMAIL_TEMPLATES);
    expect(get).toHaveBeenCalledWith('/cms/admin/email_templates');
    expect(data.items[0].id).toBe('email-welcome');
  });

  it('invalidates the exact cache key used by get()', () => {
    invalidateCmsClientCache(CMS_KEYS.CONTACT);
    expect(clearRequestCache).toHaveBeenCalledWith(`cms:${JSON.stringify({ key: CMS_KEYS.CONTACT })}`);
  });

  it('writes contact settings via PUT and returns updated data', async () => {
    put.mockResolvedValue({
      data: {
        key: CMS_KEYS.CONTACT,
        data: { email: 'hello@apnastore.org', phone: '' },
        version: 2,
      },
    });

    const data = await cmsApi.update(CMS_KEYS.CONTACT, {
      email: 'hello@apnastore.org',
      phone: '',
    });

    expect(put).toHaveBeenCalledWith('/cms/contact', {
      data: { email: 'hello@apnastore.org', phone: '' },
    });
    expect(data.email).toBe('hello@apnastore.org');
  });

  it('includes banners CMS key', () => {
    expect(CMS_KEYS.BANNERS).toBe('banners');
  });
});
