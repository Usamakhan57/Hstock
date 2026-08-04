/**
 * Testimonials from Mongo CMS.
 */
import { cmsApi, CMS_KEYS } from './cmsApi';

function initialsFor(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';
}

function mapToStorefront(t) {
  return {
    id: t.id,
    name: t.customerName,
    role: 'Verified Buyer',
    text: t.review,
    initials: initialsFor(t.customerName),
    rating: t.rating ?? 5,
  };
}

export async function fetchStorefrontTestimonials() {
  const data = await cmsApi.get(CMS_KEYS.TESTIMONIALS);
  const items = Array.isArray(data?.items) ? data.items : [];
  return items.filter((t) => t.status === 'published').map(mapToStorefront);
}

/** Sync fallback used only before async hydrate — prefer fetchStorefrontTestimonials. */
export function getStorefrontTestimonials() {
  return [];
}

export default {
  fetchStorefrontTestimonials,
  getStorefrontTestimonials,
};
