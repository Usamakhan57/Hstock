/**
 * In-memory catalog cache so existing sync repository helpers keep working
 * while data is loaded from the backend.
 */
import {
  fetchCategories,
  fetchCollections,
  fetchProducts,
} from './catalogApi';
import { mapBackendSeller } from '../lib/mappers/catalogMappers';

let categories = [];
let collections = [];
let products = [];
let sellers = [];
let hydrated = false;
let hydratePromise = null;
let version = 0;
const listeners = new Set();

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
    map.set(key, {
      ...mapBackendSeller({
        _id: p.sellerId,
        storeName: p.artist,
        storeSlug: p.sellerSlug || p.artistSlug,
        status: p.verifiedSeller ? 'approved' : undefined,
        verified: !!p.verifiedSeller,
        metrics: {
          productsCount: productCount,
          totalSales: sales,
          rating: avg,
        },
      }),
      _ratings: ratings,
    });
  });
  return [...map.values()].map(({ _ratings, ...seller }) => seller);
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
  if (hydrated && !force) return { categories, collections, products, sellers, version };
  if (hydratePromise && !force) return hydratePromise;

  hydratePromise = (async () => {
    const [catItems, colItems, productItems] = await Promise.all([
      fetchAllCatalog((params) => fetchCategories(params)),
      fetchAllCatalog((params) => fetchCollections(params)),
      fetchAllCatalog((params) => fetchProducts(params)),
    ]);
    categories = catItems;
    collections = colItems;
    products = productItems;
    sellers = deriveSellersFromProducts(products);
    hydrated = true;
    version += 1;
    notify();
    return { categories, collections, products, sellers, version };
  })().finally(() => {
    hydratePromise = null;
  });

  return hydratePromise;
}

export function getCachedCategories() {
  return categories;
}

export function getCachedCollections() {
  return collections;
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
  getCachedCategories,
  getCachedCollections,
  getCachedProducts,
  getCachedSellers,
  isCatalogHydrated,
  getCatalogVersion,
  subscribeCatalog,
};
