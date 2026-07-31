/**
 * Storefront sellers repository — derived from backend product sellers.
 */
import { getCachedSellers, hydrateCatalog } from './catalogCache';
import { fetchProducts, productsApi } from './catalogApi';

function initialsFor(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';
}

function decorate(seller) {
  return {
    ...seller,
    id: seller.id || seller._id,
    initials: initialsFor(seller.name),
    verified: seller.verified !== false,
  };
}

export function getStorefrontSellers() {
  return getCachedSellers().map(decorate);
}

export function getSellerBySlug(slug) {
  return getStorefrontSellers().find((s) => s.slug === slug) || null;
}

export function resolveSellerVerified(artistName) {
  const seller = getStorefrontSellers().find((s) => s.name === artistName);
  return seller ? !!seller.verified : false;
}

export async function loadSellers() {
  await hydrateCatalog();
  return getStorefrontSellers();
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

export default {
  getStorefrontSellers,
  getSellerBySlug,
  resolveSellerVerified,
  loadSellers,
  getSellerProducts,
  enrichSellerFromProducts,
};
