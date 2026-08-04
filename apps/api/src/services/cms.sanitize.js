import {
  ADMIN_ONLY_CMS_KEYS,
  CMS_KEYS,
} from '../constants/cmsDefaults.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPublishedListItem(key, item) {
  if (!item || typeof item !== 'object') return false;
  const status = String(item.status || '').toLowerCase();

  if (key === CMS_KEYS.FAQS || key === CMS_KEYS.STATIC_PAGES || key === CMS_KEYS.TESTIMONIALS) {
    return status === 'published';
  }
  if (key === CMS_KEYS.HERO_SLIDES) {
    return status === 'active' || status === 'published';
  }
  if (key === CMS_KEYS.BANNERS) {
    return status === 'active' || status === 'published';
  }
  if (key === CMS_KEYS.POPUPS) {
    return item.enabled === true;
  }
  return true;
}

/**
 * Strip drafts / internal fields before returning CMS to anonymous clients.
 */
export function sanitizeCmsDataForPublic(key, data) {
  if (ADMIN_ONLY_CMS_KEYS.includes(key)) return null;
  const next = clone(data || {});

  if (Array.isArray(next.items)) {
    next.items = next.items.filter((item) => isPublishedListItem(key, item));
  }

  if (key === CMS_KEYS.POPULAR_TAGS && Array.isArray(next.tags)) {
    next.tags = next.tags.filter((tag) => tag && tag.enabled !== false);
  }

  if (key === CMS_KEYS.HOMEPAGE && Array.isArray(next.sections)) {
    next.sections = next.sections.filter((section) => section && section.enabled !== false);
  }

  return next;
}

export default {
  sanitizeCmsDataForPublic,
};
