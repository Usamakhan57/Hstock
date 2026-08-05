/**
 * Storefront sellers repository — public /sellers API + catalog cache.
 */
import { get } from '../lib/apiClient';
import { getCachedSellers, hydrateCatalog, invalidateSellerCatalog } from './catalogCache';
import { fetchProducts, productsApi } from './catalogApi';
import { mapBackendSeller } from '../lib/mappers/catalogMappers';
import { clearRequestCache, cacheKey, cachedRequest } from '../lib/requestCache';

function initialsFor(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';
}

function decorate(seller) {
  if (!seller) return null;
  const verified = seller.verified === true || seller.sellerVerified === true;
  return {
    ...seller,
    id: seller.id || seller._id,
    initials: initialsFor(seller.name),
    verified,
    sellerVerified: verified,
    logo: seller.logo || seller.avatar || null,
    avatar: seller.avatar || seller.logo || null,
    banner: seller.banner || null,
    bio: seller.bio || '',
  };
}

export function getStorefrontSellers() {
  return getCachedSellers().map(decorate).filter(Boolean);
}

export function getSellerBySlug(slug) {
  return getStorefrontSellers().find((s) => s.slug === slug) || null;
}

export function resolveSellerVerified(artistName) {
  const seller = getStorefrontSellers().find((s) => s.name === artistName);
  return seller ? !!seller.verified : false;
}

export async function loadSellers({ force = false } = {}) {
  await hydrateCatalog({ force });
  return getStorefrontSellers();
}

export async function fetchSellerBySlug(slug, { force = false } = {}) {
  if (!slug) return null;
  const key = cacheKey('sellers', { slug });
  if (force) clearRequestCache(key);
  try {
    const seller = await cachedRequest(key, async () => {
      const { data } = await get(`/sellers/${encodeURIComponent(slug)}`);
      return mapBackendSeller(data);
    }, 5_000);
    return decorate(seller);
  } catch {
    await hydrateCatalog({ force });
    return getSellerBySlug(slug);
  }
}

export async function getSellerProducts(slugOrName) {
  await hydrateCatalog();
  const seller = getSellerBySlug(slugOrName)
    || getStorefrontSellers().find((s) => s.name === slugOrName)
    || null;
  if (!seller) return [];

  if (seller.id) {
    const { items } = await fetchProducts({ seller: seller.id, limit: 100 });
    if (items.length) return items;
  }

  const list = await productsApi.list({ limit: 100 });
  return list.filter(
    (p) => p.sellerSlug === seller.slug
      || p.artist === seller.name
      || String(p.sellerId) === String(seller.id),
  );
}

/** Enrich a seller card with stats computed from their live products. */
export function enrichSellerFromProducts(seller, products = []) {
  if (!seller) return null;
  const ratings = products.map((p) => p.rating).filter((r) => r != null && r > 0);
  const avgRating = ratings.length
    ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10
    : seller.rating;
  const sales = products.reduce((sum, p) => sum + (p.salesCount || p.downloads || 0), 0);
  return {
    ...seller,
    productCount: products.length || seller.productCount || 0,
    rating: avgRating,
    totalSalesAmount: seller.totalSalesAmount || sales,
  };
}

export { invalidateSellerCatalog };

export default {
  getStorefrontSellers,
  getSellerBySlug,
  resolveSellerVerified,
  loadSellers,
  fetchSellerBySlug,
  getSellerProducts,
  enrichSellerFromProducts,
  invalidateSellerCatalog,
};
