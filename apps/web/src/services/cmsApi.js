import { get, put } from '../lib/apiClient';
import { clearRequestCache, cachedRequest, cacheKey } from '../lib/requestCache';

export const CMS_KEYS = Object.freeze({
  POPULAR_TAGS: 'popular_tags',
  CONTACT: 'contact',
  HOMEPAGE: 'homepage',
  HEADER: 'header',
  FOOTER: 'footer',
  GLOBAL: 'global',
  SOCIAL: 'social',
  NEWSLETTER: 'newsletter',
  FAQ_CATEGORIES: 'faq_categories',
  FAQS: 'faqs',
  STATIC_PAGES: 'static_pages',
  HERO_SLIDES: 'hero_slides',
  POPUPS: 'popups',
  SEO: 'seo',
  TESTIMONIALS: 'testimonials',
  NAV_MENUS: 'nav_menus',
  EMAIL_TEMPLATES: 'email_templates',
});

const CMS_CHANNEL = 'apnastore-cms';

function notifyLocal(key, version) {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(CMS_CHANNEL);
      channel.postMessage({ type: 'cms:updated', key, version, at: Date.now() });
      channel.close();
    }
  } catch {
    // BroadcastChannel unavailable
  }
  try {
    window.dispatchEvent(new CustomEvent('cms:updated', { detail: { key, version } }));
  } catch {
    // SSR / non-browser
  }
}

export function invalidateCmsClientCache(key) {
  if (key) {
    clearRequestCache(`cms:${key}`);
  } else {
    clearRequestCache('cms:');
  }
  clearRequestCache('cms:versions');
}

export const cmsApi = {
  async get(key, { force = false } = {}) {
    const keyName = cacheKey('cms', { key });
    if (force) clearRequestCache(`cms:${JSON.stringify({ key })}`);
    // 2s TTL — admin saves invalidate immediately; anonymous tabs refresh quickly.
    const doc = await cachedRequest(keyName, async () => {
      const { data } = await get(`/cms/${key}`);
      return data;
    }, 2000);
    return doc?.data ?? doc;
  },

  async getDocument(key, options) {
    return this.get(key, options);
  },

  async getMany(keys = [], { force = false } = {}) {
    const params = keys.length ? { keys: keys.join(',') } : undefined;
    const keyName = cacheKey('cms:many', { keys });
    if (force) clearRequestCache('cms:many');
    const { data } = await cachedRequest(keyName, async () => {
      const result = await get('/cms', { params });
      return result.data;
    }, 2000);
    return data || {};
  },

  async getVersions({ force = false } = {}) {
    const keyName = cacheKey('cms:versions', {});
    if (force) clearRequestCache('cms:versions');
    const { data } = await cachedRequest(keyName, async () => {
      const result = await get('/cms/versions');
      return result.data;
    }, 2000);
    return data;
  },

  async update(key, payload) {
    const body = payload && typeof payload === 'object' && 'data' in payload
      ? payload
      : { data: payload };
    const { data } = await put(`/cms/${key}`, body);
    invalidateCmsClientCache(key);
    notifyLocal(key, data?.version);
    return data?.data ?? data;
  },
};

export function subscribeCmsUpdates(handler) {
  const onCustom = (event) => handler(event.detail || {});
  let channel = null;
  try {
    window.addEventListener('cms:updated', onCustom);
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(CMS_CHANNEL);
      channel.onmessage = (event) => {
        if (event?.data?.type === 'cms:updated') handler(event.data);
      };
    }
  } catch {
    // ignore
  }
  return () => {
    try {
      window.removeEventListener('cms:updated', onCustom);
      channel?.close();
    } catch {
      // ignore
    }
  };
}

export default cmsApi;
