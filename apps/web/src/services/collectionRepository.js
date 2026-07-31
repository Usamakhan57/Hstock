/**
 * Storefront collections repository — backed by backend catalog cache.
 */
import { getCachedCollections, hydrateCatalog } from './catalogCache';

function mapCollection(c) {
  return {
    id: c.id || c._id,
    slug: c.slug,
    title: c.name || c.title,
    name: c.name || c.title,
    description: c.description || '',
    cover: c.coverImage || c.image || c.cover || '',
    image: c.image || c.coverImage || c.cover || '',
    productIds: Array.isArray(c.productIds) ? c.productIds : [],
    productCount: c.productCount ?? 0,
    featured: !!c.featured,
  };
}

export function getStorefrontCollections() {
  return getCachedCollections().map(mapCollection);
}

export function getCollectionBySlug(slug) {
  return getStorefrontCollections().find((c) => c.slug === slug) || null;
}

export async function loadCollections() {
  await hydrateCatalog();
  return getStorefrontCollections();
}

export default {
  getStorefrontCollections,
  getCollectionBySlug,
  loadCollections,
};
