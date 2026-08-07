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
  BANNERS: 'banners',
});

const CMS_CHANNEL = 'apnastore-cms';
const VERSION_POLL_MS = 30000;

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
    // Must match cacheKey('cms', { key }) → `cms:${JSON.stringify({ key })}`
    clearRequestCache(cacheKey('cms', { key }));
    clearRequestCache(cacheKey('cms:admin', { key }));
    clearRequestCache(`cms:${key}`);
  } else {
    clearRequestCache('cms:');
  }
  clearRequestCache(cacheKey('cms:versions', {}));
  clearRequestCache(cacheKey('cms:admin-versions', {}));
  clearRequestCache('cms:versions');
  clearRequestCache('cms:many');
}

/* ------------------------------------------------------------------ */
/*  Single global version poller — one interval for the whole app     */
/* ------------------------------------------------------------------ */
let pollerStarted = false;
let knownVersions = {};
const versionListeners = new Set();

function emitVersionChange(changedKeys) {
  const detail = { keys: changedKeys, versions: { ...knownVersions } };
  versionListeners.forEach((fn) => {
    try { fn(detail); } catch { /* ignore */ }
  });
  changedKeys.forEach((key) => notifyLocal(key, knownVersions[key]?.version));
}

async function pollVersionsOnce() {
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
  try {
    // Soft poll — use short cache; do not force-bypass on every tick.
    const payload = await cmsApi.getVersions({ force: false });
    const remote = payload?.versions || {};
    const changed = [];
    for (const [key, meta] of Object.entries(remote)) {
      const nextVer = meta?.version;
      if (nextVer == null) continue;
      if (knownVersions[key] == null) {
        knownVersions[key] = meta;
        continue;
      }
      if (knownVersions[key].version !== nextVer) {
        knownVersions[key] = meta;
        changed.push(key);
      }
    }
    if (changed.length) {
      changed.forEach((key) => invalidateCmsClientCache(key));
      emitVersionChange(changed);
    }
  } catch {
    // ignore poll errors
  }
}

export function ensureCmsVersionPoller() {
  if (pollerStarted || typeof window === 'undefined') return;
  pollerStarted = true;
  window.setInterval(pollVersionsOnce, VERSION_POLL_MS);
  // Seed baseline versions once so the first real change is detectable.
  pollVersionsOnce();
}

export function subscribeCmsVersionChanges(handler) {
  ensureCmsVersionPoller();
  versionListeners.add(handler);
  return () => versionListeners.delete(handler);
}

export const cmsApi = {
  async get(key, { force = false, admin = false } = {}) {
    const ns = admin ? 'cms:admin' : 'cms';
    const path = admin ? `/cms/admin/${key}` : `/cms/${key}`;
    const keyName = cacheKey(ns, { key });
    if (force) clearRequestCache(keyName);
    const doc = await cachedRequest(keyName, async () => {
      const { data } = await get(path);
      return data;
    }, 2000);
    return doc?.data ?? doc;
  },

  async getDocument(key, options) {
    return this.get(key, options);
  },

  /** Authenticated admin read — includes drafts & email_templates. */
  async getAdmin(key, options = {}) {
    return this.get(key, { ...options, admin: true });
  },

  async getMany(keys = [], { force = false, admin = false } = {}) {
    const params = keys.length ? { keys: keys.join(',') } : undefined;
    const path = admin ? '/cms/admin' : '/cms';
    const keyName = cacheKey(admin ? 'cms:admin-many' : 'cms:many', { keys });
    if (force) clearRequestCache(keyName);
    const { data } = await cachedRequest(keyName, async () => {
      const result = await get(path, { params });
      return result.data;
    }, 2000);
    return data || {};
  },

  async getVersions({ force = false, admin = false } = {}) {
    const path = admin ? '/cms/admin/versions' : '/cms/versions';
    const keyName = cacheKey(admin ? 'cms:admin-versions' : 'cms:versions', {});
    if (force) clearRequestCache(keyName);
    const { data } = await cachedRequest(keyName, async () => {
      const result = await get(path);
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
    if (data?.version != null) {
      knownVersions[key] = { version: data.version, updatedAt: data.updatedAt || null };
    }
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
