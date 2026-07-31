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
    if (!key || map.has(key)) return;
    map.set(key, mapBackendSeller({
      _id: p.sellerId,
      storeName: p.artist,
      storeSlug: p.sellerSlug || p.artistSlug,
      status: 'approved',
    }));
  });
  return [...map.values()];
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

export async function hydrateCatalog({ force = false } = {}) {
  if (hydrated && !force) return { categories, collections, products, sellers, version };
  if (hydratePromise && !force) return hydratePromise;

  hydratePromise = (async () => {
    const [catRes, colRes, productRes] = await Promise.all([
      fetchCategories({ limit: 100 }).catch(() => ({ items: [] })),
      fetchCollections({ limit: 100 }).catch(() => ({ items: [] })),
      fetchProducts({ limit: 100 }).catch(() => ({ items: [] })),
    ]);
    categories = catRes.items || [];
    collections = colRes.items || [];
    products = productRes.items || [];
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
