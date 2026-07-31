/**
 * Global digital asset identifier normalization for marketplace uniqueness.
 */

const MULTI_SPACE = /\s+/g;
const TRAILING_SLASHES = /\/+$/g;

/**
 * Normalize a raw digital asset identifier to a canonical comparable form.
 * Rules: lowercase, trim, collapse spaces, strip trailing slashes,
 * normalize URLs/usernames/emails/domains by product type / platform.
 */
export function normalizeAssetIdentifier(raw, {
  productType = null,
  assetPlatform = null,
} = {}) {
  if (raw === undefined || raw === null) return null;
  let value = String(raw).trim();
  if (!value) return null;

  value = value.replace(MULTI_SPACE, ' ');
  value = value.toLowerCase();

  const kind = resolveAssetKind(productType, assetPlatform, value);

  switch (kind) {
    case 'email':
      return normalizeEmail(value);
    case 'domain':
      return normalizeDomain(value);
    case 'website':
    case 'url':
    case 'saas':
      return normalizeUrl(value);
    case 'instagram':
    case 'facebook':
    case 'tiktok':
    case 'twitter':
    case 'telegram':
    case 'discord':
    case 'youtube':
      return normalizeUsername(value, kind);
    case 'source_code':
    case 'script':
    case 'app':
    case 'template':
    case 'course':
    case 'ebook':
    case 'license_key':
    case 'digital_file':
    case 'generic':
    default:
      return normalizeGeneric(value);
  }
}

export function resolveAssetKind(productType, assetPlatform, rawValue = '') {
  if (assetPlatform) {
    return String(assetPlatform).toLowerCase();
  }

  const type = String(productType || '').toLowerCase();
  const value = String(rawValue || '').toLowerCase();

  // Product-type mapping takes precedence over value heuristics
  // (e.g. "@user" for Instagram must not be treated as email).
  if (type === 'email_accounts') return 'email';
  if (type === 'domains') return 'domain';
  if (type === 'websites') return 'website';
  if (type === 'saas' || type === 'ai_tools') return 'saas';
  if (type === 'instagram') return 'instagram';
  if (type === 'facebook') return 'facebook';
  if (type === 'tiktok') return 'tiktok';
  if (type === 'twitter') return 'twitter';
  if (type === 'telegram') return 'telegram';
  if (type === 'discord') return 'discord';
  if (type === 'youtube') return 'youtube';
  if (type === 'source_code') return 'source_code';
  if (type === 'scripts') return 'script';
  if (type === 'apps') return 'app';
  if (type === 'templates') return 'template';
  if (type === 'courses') return 'course';
  if (type === 'ebooks') return 'ebook';
  if (type === 'license_keys') return 'license_key';
  if (type === 'digital_files') return 'digital_file';
  if (type === 'social_accounts') {
    if (value.includes('instagram.com') || value.startsWith('@')) return 'instagram';
    if (value.includes('tiktok.com')) return 'tiktok';
    if (value.includes('t.me') || value.includes('telegram')) return 'telegram';
    if (value.includes('facebook.com') || value.includes('fb.com')) return 'facebook';
    if (value.includes('twitter.com') || value.includes('x.com')) return 'twitter';
    if (value.includes('discord')) return 'discord';
    if (value.includes('youtube.com') || value.includes('youtu.be')) return 'youtube';
    return 'generic';
  }

  // Value heuristics when product type is unknown / generic
  if (value.includes('@') && !value.startsWith('@')) return 'email';
  if (value.startsWith('@')) return 'instagram';

  return 'generic';
}

function normalizeEmail(value) {
  return value.replace(MULTI_SPACE, '').trim().toLowerCase();
}

function normalizeUsername(value, platform) {
  let v = value.trim().toLowerCase();

  // Strip common URL forms down to handle
  try {
    if (v.includes('://') || v.startsWith('www.')) {
      const url = new URL(v.startsWith('http') ? v : `https://${v}`);
      v = url.pathname.replace(/^\/+/, '').replace(TRAILING_SLASHES, '');
      // youtube channel paths etc.
      v = v.replace(/^(c|channel|user|@)\//, '');
    }
  } catch {
    // keep raw
  }

  v = v.replace(/^@+/, '');
  v = v.replace(TRAILING_SLASHES, '');
  v = v.replace(MULTI_SPACE, '');
  v = v.split(/[?#]/)[0];
  v = v.split('/')[0];

  return `${platform}:${v}`;
}

function normalizeDomain(value) {
  let v = value.trim().toLowerCase();
  v = v.replace(/^https?:\/\//, '');
  v = v.replace(/^www\./, '');
  v = v.split(/[/?#]/)[0];
  v = v.replace(TRAILING_SLASHES, '');
  return `domain:${v}`;
}

function normalizeUrl(value) {
  let v = value.trim().toLowerCase();
  if (!v.includes('://')) {
    v = `https://${v}`;
  }
  try {
    const url = new URL(v);
    let host = url.hostname.replace(/^www\./, '');
    let path = url.pathname.replace(TRAILING_SLASHES, '') || '';
    // Drop default ports and hash/query for identity
    return `url:${host}${path}`;
  } catch {
    return `url:${v.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(TRAILING_SLASHES, '')}`;
  }
}

function normalizeGeneric(value) {
  let v = value.trim().toLowerCase();
  v = v.replace(MULTI_SPACE, ' ');
  v = v.replace(TRAILING_SLASHES, '');
  if (v.includes('://') || v.startsWith('www.')) {
    return normalizeUrl(v);
  }
  // host/path style identifiers (repos, SaaS URLs without scheme)
  if (/^[a-z0-9.-]+\.[a-z]{2,}([/:?]|$)/i.test(v)) {
    return normalizeUrl(v);
  }
  if (v.includes('@') && !v.includes(' ')) {
    return normalizeEmail(v);
  }
  return v;
}

export default {
  normalizeAssetIdentifier,
  resolveAssetKind,
};
