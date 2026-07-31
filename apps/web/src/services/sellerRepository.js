/**
 * Storefront sellers repository — derived from backend product sellers.
 */
import { getCachedSellers, hydrateCatalog } from './catalogCache';
import { productsApi } from './catalogApi';

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
  const list = await productsApi.list({ limit: 100 });
  return list.filter(
    (p) => p.sellerSlug === seller.slug
      || p.artist === seller.name
      || String(p.sellerId) === String(seller.id),
  );
}

export default {
  getStorefrontSellers,
  getSellerBySlug,
  resolveSellerVerified,
  loadSellers,
  getSellerProducts,
};
