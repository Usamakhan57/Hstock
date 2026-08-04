import { CmsContent } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { CMS_DEFAULTS, CMS_KEY_LIST } from '../constants/cmsDefaults.js';
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

function toPublicDoc(doc) {
  if (!doc) return null;
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    key: plain.key,
    data: plain.data,
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
    memoryCache.delete('__versions__');
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
  const doc = await CmsContent.findOneAndUpdate(
    { key },
    { $setOnInsert: { key, data: defaults, version: 1 } },
    { upsert: true, new: true, ...opts },
  );
  return doc;
}

export async function getCmsDocument(key, { bypassCache = false } = {}) {
  assertKey(key);
  if (!bypassCache) {
    const hit = memoryCache.get(key);
    // Very short TTL so anonymous visitors pick up admin saves quickly
    // even without a socket connection.
    if (hit && Date.now() - hit.at < 2000) {
      return hit.value;
    }
  }

  const doc = await ensureCmsDocument(key);
  const payload = toPublicDoc(doc);
  setCache(key, payload);
  return payload;
}

export async function getCmsDocuments(keys = CMS_KEY_LIST) {
  const wanted = (keys.length ? keys : CMS_KEY_LIST).filter((key) => CMS_DEFAULTS[key]);
  const results = {};
  await Promise.all(
    wanted.map(async (key) => {
      results[key] = await getCmsDocument(key);
    }),
  );
  return results;
}

export async function getCmsVersions() {
  const cached = memoryCache.get('__versions__');
  if (cached && Date.now() - cached.at < 2000) {
    return cached.value;
  }

  await Promise.all(CMS_KEY_LIST.map((key) => ensureCmsDocument(key)));
  const docs = await CmsContent.find({ key: { $in: CMS_KEY_LIST } })
    .select('key version updatedAt')
    .lean();

  const versions = {};
  for (const key of CMS_KEY_LIST) {
    const doc = docs.find((d) => d.key === key);
    versions[key] = {
      version: doc?.version || 1,
      updatedAt: doc?.updatedAt || null,
    };
  }

  const payload = { versions, generatedAt: new Date().toISOString() };
  memoryCache.set('__versions__', { value: payload, at: Date.now() });
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

  const payload = toPublicDoc(updated);
  invalidateCmsCache(key);
  setCache(key, payload);
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
};
