/**
 * In-memory catalog cache so existing sync repository helpers keep working
 * while data is loaded from the backend.
 */
import {
  fetchCategories,
  fetchProducts,
} from './catalogApi';
import { clearRequestCache } from '../lib/requestCache';
import { mapBackendSeller } from '../lib/mappers/catalogMappers';
import { get } from '../lib/apiClient';

let categories = [];
let products = [];
let sellers = [];
let hydrated = false;
let hydratedAt = 0;
let hydratePromise = null;
let version = 0;
const listeners = new Set();
const CATALOG_TTL_MS = 10_000;

function deriveSellersFromProducts(productList) {
  const map = new Map();
  productList.forEach((p) => {
    const key = p.sellerId || p.artist;
    if (!key) return;
    const existing = map.get(key);
    const ratings = existing?._ratings || [];
    if (p.rating != null && p.rating > 0) ratings.push(p.rating);
    const productCount = (existing?.productCount || 0) + 1;
    const sales = (existing?.totalSalesAmount || 0) + (p.salesCount || p.downloads || 0);
    const avg = ratings.length
      ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
      : null;
    const rawSeller = p.seller || p.sellerRaw || p.raw?.seller || null;
    map.set(key, {
      ...mapBackendSeller({
        _id: p.sellerId,
        storeName: p.artist,
        storeSlug: p.sellerSlug || p.artistSlug,
        status: undefined,
        verified: !!p.verifiedSeller,
        logo: rawSeller?.logo || existing?.logo || null,
        avatar: rawSeller?.avatar || existing?.avatar || null,
        banner: rawSeller?.banner || existing?.banner || null,
        bio: rawSeller?.bio || existing?.bio || '',
        specialty: rawSeller?.specialty || existing?.specialty || '',
        storePromotionActive: !!(p.storePromoted || existing?.storePromoted),
        storePromotedUntil: p.storePromotedUntil || existing?.storePromotedUntil || null,
        metrics: {
          productsCount: productCount,
          totalSales: sales,
          rating: avg,
        },
      }),
      _ratings: ratings,
    });
  });
  return [...map.values()]
    .map(({ _ratings, ...seller }) => seller)
    .sort((a, b) => Number(!!b.storePromoted) - Number(!!a.storePromoted));
}

async function fetchPublicSellers() {
  try {
    const { data } = await get('/sellers', { params: { limit: 100 } });
    const items = Array.isArray(data) ? data : [];
    return items.map(mapBackendSeller).filter(Boolean);
  } catch {
    return null;
  }
}

function mergeSellerLists(apiSellers, derived) {
  if (!apiSellers?.length) return derived;
  const byId = new Map();
  apiSellers.forEach((s) => {
    if (s?.id) byId.set(String(s.id), { ...s });
    if (s?.slug) byId.set(`slug:${s.slug}`, { ...s });
  });
  derived.forEach((s) => {
    const key = s.id ? String(s.id) : null;
    const existing = (key && byId.get(key)) || (s.slug && byId.get(`slug:${s.slug}`));
    if (existing) {
      const merged = {
        ...existing,
        productCount: Math.max(existing.productCount || 0, s.productCount || 0),
        rating: existing.rating ?? s.rating,
        totalSalesAmount: Math.max(existing.totalSalesAmount || 0, s.totalSalesAmount || 0),
        storePromoted: existing.storePromoted || s.storePromoted,
        storePromotedUntil: existing.storePromotedUntil || s.storePromotedUntil,
      };
      if (key) byId.set(key, merged);
      if (merged.slug) byId.set(`slug:${merged.slug}`, merged);
    } else if (key) {
      byId.set(key, s);
      if (s.slug) byId.set(`slug:${s.slug}`, s);
    }
  });
  const unique = new Map();
  byId.forEach((s) => {
    if (s?.id) unique.set(String(s.id), s);
  });
  return [...unique.values()].sort(
    (a, b) => Number(!!b.storePromoted) - Number(!!a.storePromoted),
  );
}

function notify() {
  listeners.forEach((listener) => {
    try {
      listener(version);
    } catch {
      // ignore subscriber errors
    }
  });
}

export function subscribeCatalog(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function fetchAllCatalog(fetchPage, { limit = 100, maxPages = 50 } = {}) {
  let page = 1;
  const items = [];
  while (page <= maxPages) {
    // eslint-disable-next-line no-await-in-loop
    const result = await fetchPage({ page, limit }).catch(() => ({ items: [], meta: null }));
    const batch = result.items || [];
    items.push(...batch);
    const total = result.meta?.total;
    if (total != null && items.length >= total) break;
    if (batch.length < limit) break;
    page += 1;
  }
  return items;
}

export async function hydrateCatalog({ force = false } = {}) {
  const stale = hydrated && (Date.now() - hydratedAt) > CATALOG_TTL_MS;
  if (hydrated && !force && !stale) return { categories, products, sellers, version };
  if (hydratePromise && !force) return hydratePromise;

  hydratePromise = (async () => {
    if (force || stale) {
      clearRequestCache('categories');
      clearRequestCache('products');
      clearRequestCache('sellers');
    }
    const [catItems, productItems, apiSellers] = await Promise.all([
      fetchAllCatalog((params) => fetchCategories(params)),
      fetchAllCatalog((params) => fetchProducts(params)),
      fetchPublicSellers(),
    ]);
    categories = catItems;
    products = productItems;
    sellers = mergeSellerLists(apiSellers, deriveSellersFromProducts(products));
    hydrated = true;
    hydratedAt = Date.now();
    version += 1;
    notify();
    return { categories, products, sellers, version };
  })().finally(() => {
    hydratePromise = null;
  });

  return hydratePromise;
}

/** Force-bust catalog + seller caches after profile branding updates. */
export async function invalidateSellerCatalog() {
  clearRequestCache('sellers');
  clearRequestCache('products');
  clearRequestCache('product');
  clearRequestCache('categories');
  return hydrateCatalog({ force: true });
}

export function getCachedCategories() {
  return categories;
}

export function getCachedProducts() {
  return products;
}

export function getCachedSellers() {
  return sellers;
}

export function isCatalogHydrated() {
  return hydrated;
}

export function getCatalogVersion() {
  return version;
}

export default {
  hydrateCatalog,
  invalidateSellerCatalog,
  getCachedCategories,
  getCachedProducts,
  getCachedSellers,
  isCatalogHydrated,
  getCatalogVersion,
  subscribeCatalog,
};
