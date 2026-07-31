import { get } from '../lib/apiClient';
import {
  mapBackendCategory,
  mapBackendCollection,
  mapBackendProduct,
  mapBackendSeller,
} from '../lib/mappers/catalogMappers';
import { PRICE_RANGES, DEFAULT_FILTERS } from '../constants';
import { isManualHandover } from './productMeta';

function applyClientFilters(list, filters = DEFAULT_FILTERS) {
  const range = PRICE_RANGES.find((r) => r.id === filters.price) || PRICE_RANGES[0];
  return list.filter((p) => {
    if (filters.categoryNames?.length) {
      if (!filters.categoryNames.includes(p.cat)) return false;
    } else if (filters.category && filters.category !== 'All' && p.cat !== filters.category) {
      return false;
    }
    if (p.price < range.min || p.price > range.max) return false;
    if (filters.rating && p.rating < filters.rating) return false;
    if (filters.fileTypes?.length && !filters.fileTypes.some((t) => p.fileTypes?.includes(t))) return false;
    if (filters.licenses?.length && !filters.licenses.some((l) => p.licenseIds?.includes(l))) return false;
    if (filters.deliveryTime === 'instant' && isManualHandover(p)) return false;
    if (filters.deliveryTime === 'manual' && !isManualHandover(p)) return false;
    if (filters.verifiedOnly && !p.verifiedSeller) return false;
    if (filters.promotedOnly && !p.promoted) return false;
    return true;
  });
}

function applySort(list, sort) {
  const r = [...list];
  switch (sort) {
    case 'Price: Low to High': return r.sort((a, b) => a.price - b.price);
    case 'Price: High to Low': return r.sort((a, b) => b.price - a.price);
    case 'Top Rated': return r.sort((a, b) => b.rating - a.rating);
    case 'Newest':
    case 'Date Added': return r.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    case 'Popular':
    default: return r.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  }
}

function buildProductQuery({ page = 1, limit = 100, search = '', category, featured, collection, seller } = {}) {
  const params = { page, limit };
  if (search?.trim()) params.search = search.trim();
  if (category) params.category = category;
  if (collection) params.collection = collection;
  if (seller) params.seller = seller;
  if (featured === true) params.featured = 'true';
  return params;
}

export async function fetchProducts(params = {}) {
  const { data, meta } = await get('/products', { params: buildProductQuery(params) });
  const items = Array.isArray(data) ? data.map(mapBackendProduct) : [];
  return { items, meta };
}

export async function fetchProduct(idOrSlug) {
  const { data } = await get(`/products/${idOrSlug}`);
  return mapBackendProduct(data);
}

export async function fetchCategories(params = { limit: 100 }) {
  const { data, meta } = await get('/categories', { params });
  const items = Array.isArray(data) ? data.map(mapBackendCategory) : [];
  return { items, meta };
}

export async function fetchCategory(idOrSlug) {
  const { data } = await get(`/categories/${idOrSlug}`);
  return mapBackendCategory(data);
}

export async function fetchCollections(params = { limit: 100 }) {
  const { data, meta } = await get('/collections', { params });
  const items = Array.isArray(data) ? data.map(mapBackendCollection) : [];
  return { items, meta };
}

export async function fetchCollection(idOrSlug) {
  const { data } = await get(`/collections/${idOrSlug}`);
  return mapBackendCollection(data);
}

/** Storefront productsApi-compatible surface backed by real HTTP. */
export const productsApi = {
  async list({ filters = DEFAULT_FILTERS, sort = 'Popular', query = '', page = 1, limit = 100 } = {}) {
    const categoryId = filters.categoryId || null;
    const { items } = await fetchProducts({
      page,
      limit,
      search: query,
      category: categoryId || undefined,
    });
    return applySort(applyClientFilters(items, filters), sort);
  },

  async get(id) {
    try {
      return await fetchProduct(id);
    } catch (error) {
      if (error?.status === 404) return null;
      throw error;
    }
  },

  async related(product, limit = 4) {
    const { items } = await fetchProducts({
      limit: 40,
      category: product?.categoryId || undefined,
      search: product?.cat || '',
    });
    return items
      .filter((p) => String(p.id) !== String(product?.id))
      .slice(0, limit);
  },

  async popular(limit = 12) {
    const { items } = await fetchProducts({ limit: 100 });
    return applySort(items, 'Popular').slice(0, limit);
  },

  async recommended(categoryNames = [], excludeId = null, limit = 8) {
    const { items } = await fetchProducts({ limit: 100 });
    const products = items.filter((p) => String(p.id) !== String(excludeId));
    if (categoryNames.length) {
      const matches = products.filter((p) => categoryNames.includes(p.cat));
      if (matches.length >= limit) return applySort(matches, 'Popular').slice(0, limit);
      const rest = applySort(products.filter((p) => !categoryNames.includes(p.cat)), 'Popular');
      return [...applySort(matches, 'Popular'), ...rest].slice(0, limit);
    }
    return applySort(products, 'Popular').slice(0, limit);
  },

  async featured(limit = 8) {
    const { items } = await fetchProducts({ featured: true, limit: 40 });
    if (items.length) return items.slice(0, limit);
    const all = await fetchProducts({ limit: 40 });
    return all.items.filter((p) => p.featured).slice(0, limit);
  },

  async latest(limit = 8) {
    const { items } = await fetchProducts({ limit: 40 });
    return applySort(items, 'Newest').slice(0, limit);
  },

  async search(q) {
    const needle = (q || '').trim();
    if (!needle) return { products: [], categories: [], artists: [] };
    const [{ items: products }, { items: categories }] = await Promise.all([
      fetchProducts({ search: needle, limit: 50 }),
      fetchCategories({ search: needle, limit: 20 }),
    ]);
    const artistsMap = new Map();
    products.forEach((p) => {
      if (p.sellerId || p.artist) {
        const key = p.sellerId || p.artist;
        if (!artistsMap.has(key)) {
          artistsMap.set(key, mapBackendSeller({
            _id: p.sellerId,
            storeName: p.artist,
            storeSlug: p.sellerSlug || p.artistSlug,
            verified: true,
          }));
        }
      }
    });
    return {
      products,
      categories,
      artists: [...artistsMap.values()],
    };
  },

  async suggest(q, limit = 5) {
    const result = await productsApi.search(q);
    return {
      products: result.products.slice(0, limit),
      categories: result.categories.slice(0, 3),
      artists: result.artists.slice(0, 3),
    };
  },
};

export const categoriesApi = {
  async list() {
    const { items } = await fetchCategories({ limit: 100 });
    return items;
  },
  async bySlug(slug) {
    try {
      return await fetchCategory(slug);
    } catch (error) {
      if (error?.status === 404) return null;
      throw error;
    }
  },
};

export const collectionsApi = {
  async list() {
    const { items } = await fetchCollections({ limit: 100 });
    return items;
  },
  async bySlug(slug) {
    try {
      return await fetchCollection(slug);
    } catch (error) {
      if (error?.status === 404) return null;
      throw error;
    }
  },
};

export default {
  productsApi,
  categoriesApi,
  collectionsApi,
  fetchProducts,
  fetchProduct,
  fetchCategories,
  fetchCollections,
};
