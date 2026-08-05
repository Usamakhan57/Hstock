import { CmsContent } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import {
  CMS_DEFAULTS,
  CMS_KEY_LIST,
  PUBLIC_CMS_KEYS,
  ADMIN_ONLY_CMS_KEYS,
  CMS_KEYS,
  FOOTER_CONTENT_VERSION,
} from '../constants/cmsDefaults.js';
import { sanitizeCmsDataForPublic } from './cms.sanitize.js';
import { getIO } from '../realtime/socket.server.js';
import { logger } from '../config/logger.js';

/** In-memory cache — invalidated on every write so storefront never serves stale CMS. */
const memoryCache = new Map();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertKey(key) {
  if (!CMS_DEFAULTS[key]) {
    throw new AppError(`Unknown CMS key: ${key}`, 404, { code: 'CMS_KEY_NOT_FOUND' });
  }
}

function assertPublicKey(key) {
  assertKey(key);
  if (ADMIN_ONLY_CMS_KEYS.includes(key)) {
    throw new AppError('CMS document requires authentication', 401, { code: 'CMS_AUTH_REQUIRED' });
  }
  if (!PUBLIC_CMS_KEYS.includes(key)) {
    throw new AppError(`Unknown CMS key: ${key}`, 404, { code: 'CMS_KEY_NOT_FOUND' });
  }
}

function mergeWithDefaults(key, data) {
  const defaults = clone(CMS_DEFAULTS[key] || {});
  if (!data || typeof data !== 'object' || Array.isArray(data)) return defaults;
  const merged = { ...defaults, ...clone(data) };

  for (const [field, value] of Object.entries(defaults)) {
    if (merged[field] == null) {
      merged[field] = clone(value);
    } else if (
      value
      && typeof value === 'object'
      && !Array.isArray(value)
      && typeof merged[field] === 'object'
      && !Array.isArray(merged[field])
    ) {
      merged[field] = { ...clone(value), ...merged[field] };
    }
  }

  if (key === CMS_KEYS.HOMEPAGE && Array.isArray(defaults.sections) && Array.isArray(merged.sections)) {
    const defaultHero = defaults.sections.find((s) => s.key === 'hero');
    merged.sections = merged.sections.map((section) => {
      if (!defaultHero || (section.key !== 'hero' && section.type !== 'hero')) return section;
      return { ...clone(defaultHero), ...section };
    });
    const knownKeys = new Set(merged.sections.map((s) => s.key));
    for (const section of defaults.sections) {
      if (!knownKeys.has(section.key)) {
        merged.sections.push(clone(section));
      }
    }
  }

  return merged;
}

function toPublicDoc(doc, { publicOnly = false } = {}) {
  if (!doc) return null;
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  let data = mergeWithDefaults(plain.key, plain.data);
  if (publicOnly) {
    data = sanitizeCmsDataForPublic(plain.key, data);
  }
  return {
    key: plain.key,
    data,
    version: plain.version || 1,
    updatedAt: plain.updatedAt || null,
  };
}

function setCache(key, payload) {
  memoryCache.set(key, {
    value: payload,
    at: Date.now(),
  });
}

export function invalidateCmsCache(key) {
  if (key) {
    memoryCache.delete(key);
    memoryCache.delete(`public:${key}`);
    memoryCache.delete('__versions__');
    memoryCache.delete('__public_versions__');
    return;
  }
  memoryCache.clear();
}

function broadcastCmsUpdate(payload) {
  try {
    const io = getIO();
    if (io) {
      io.emit('cms:updated', payload);
    }
  } catch (error) {
    logger.warn('CMS socket broadcast failed', { error: error.message });
  }
}

export async function ensureCmsDocument(key, session = null) {
  assertKey(key);
  const opts = session ? { session } : {};
  const defaults = clone(CMS_DEFAULTS[key]);
  let doc = await CmsContent.findOneAndUpdate(
    { key },
    { $setOnInsert: { key, data: defaults, version: 1 } },
    { upsert: true, new: true, ...opts },
  );

  if (key === CMS_KEYS.FOOTER) {
    doc = await upgradeFooterCmsIfNeeded(doc, session);
  }

  return doc;
}

/**
 * One-time upgrade of stored footer CMS to production copy/structure.
 * Preserves custom logo + social links. Admin can still edit afterward.
 */
async function upgradeFooterCmsIfNeeded(doc, session = null) {
  if (!doc) return doc;
  const data = doc.data && typeof doc.data === 'object' ? doc.data : {};
  const currentVersion = Number(data.footerContentVersion) || 0;
  if (currentVersion >= FOOTER_CONTENT_VERSION) return doc;

  const defaults = clone(CMS_DEFAULTS[CMS_KEYS.FOOTER]);
  const next = {
    ...defaults,
    logo: data.logo || defaults.logo,
    socialLinks: Array.isArray(data.socialLinks) && data.socialLinks.length
      ? data.socialLinks
      : defaults.socialLinks,
    paymentIcons: Array.isArray(data.paymentIcons) && data.paymentIcons.length
      ? data.paymentIcons
      : defaults.paymentIcons,
    footerContentVersion: FOOTER_CONTENT_VERSION,
  };

  const opts = session ? { session } : {};
  const updated = await CmsContent.findOneAndUpdate(
    { key: CMS_KEYS.FOOTER },
    {
      $set: { data: next },
      $inc: { version: 1 },
    },
    { new: true, ...opts },
  );
  invalidateCmsCache(CMS_KEYS.FOOTER);
  return updated || doc;
}

export async function getCmsDocument(key, { bypassCache = false, publicOnly = false } = {}) {
  if (publicOnly) {
    assertPublicKey(key);
  } else {
    assertKey(key);
  }

  const cacheKeyName = publicOnly ? `public:${key}` : key;
  if (!bypassCache) {
    const hit = memoryCache.get(cacheKeyName);
    if (hit && Date.now() - hit.at < 2000) {
      return hit.value;
    }
  }

  const doc = await ensureCmsDocument(key);
  const payload = toPublicDoc(doc, { publicOnly });
  setCache(cacheKeyName, payload);
  return payload;
}

export async function getCmsDocuments(keys, { publicOnly = false } = {}) {
  const allowed = publicOnly ? PUBLIC_CMS_KEYS : CMS_KEY_LIST;
  const wanted = (keys?.length ? keys : allowed)
    .filter((key) => allowed.includes(key) && CMS_DEFAULTS[key]);

  if (publicOnly) {
    for (const key of (keys || [])) {
      if (ADMIN_ONLY_CMS_KEYS.includes(key)) {
        throw new AppError('CMS document requires authentication', 401, { code: 'CMS_AUTH_REQUIRED' });
      }
    }
  }

  const results = {};
  await Promise.all(
    wanted.map(async (key) => {
      results[key] = await getCmsDocument(key, { publicOnly });
    }),
  );
  return results;
}

export async function getCmsVersions({ publicOnly = false } = {}) {
  const cacheName = publicOnly ? '__public_versions__' : '__versions__';
  const cached = memoryCache.get(cacheName);
  if (cached && Date.now() - cached.at < 2000) {
    return cached.value;
  }

  const keys = publicOnly ? PUBLIC_CMS_KEYS : CMS_KEY_LIST;
  await Promise.all(keys.map((key) => ensureCmsDocument(key)));
  const docs = await CmsContent.find({ key: { $in: [...keys] } })
    .select('key version updatedAt')
    .lean();

  const versions = {};
  for (const key of keys) {
    const doc = docs.find((d) => d.key === key);
    versions[key] = {
      version: doc?.version || 1,
      updatedAt: doc?.updatedAt || null,
    };
  }

  const payload = { versions, generatedAt: new Date().toISOString() };
  memoryCache.set(cacheName, { value: payload, at: Date.now() });
  return payload;
}

export async function updateCmsDocument(key, data, userId = null) {
  assertKey(key);
  if (data == null || typeof data !== 'object' || Array.isArray(data)) {
    throw new AppError('CMS data must be an object', 400, { code: 'VALIDATION_ERROR' });
  }

  await ensureCmsDocument(key);
  const updated = await CmsContent.findOneAndUpdate(
    { key },
    {
      $set: {
        data: clone(data),
        updatedBy: userId || null,
      },
      $inc: { version: 1 },
    },
    { new: true },
  );

  if (!updated) {
    throw new AppError('CMS document not found', 404, { code: 'CMS_NOT_FOUND' });
  }

  const payload = toPublicDoc(updated, { publicOnly: false });
  invalidateCmsCache(key);
  setCache(key, payload);
  setCache(`public:${key}`, toPublicDoc(updated, { publicOnly: true }));
  broadcastCmsUpdate({ key, version: payload.version, updatedAt: payload.updatedAt });
  return payload;
}

export async function seedAllCmsDocuments() {
  const results = {};
  for (const key of CMS_KEY_LIST) {
    // eslint-disable-next-line no-await-in-loop
    results[key] = toPublicDoc(await ensureCmsDocument(key));
  }
  return results;
}

export default {
  getCmsDocument,
  getCmsDocuments,
  getCmsVersions,
  updateCmsDocument,
  ensureCmsDocument,
  invalidateCmsCache,
  seedAllCmsDocuments,
  PUBLIC_CMS_KEYS,
  ADMIN_ONLY_CMS_KEYS,
};

export { sanitizeCmsDataForPublic } from './cms.sanitize.js';
