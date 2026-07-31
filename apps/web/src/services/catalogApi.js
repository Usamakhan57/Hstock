import { get } from '../lib/apiClient';
import { cacheKey, cachedRequest } from '../lib/requestCache';
import {
  mapBackendCategory,
  mapBackendProduct,
  mapBackendSeller,
} from '../lib/mappers/catalogMappers';
import { PRICE_RANGES, DEFAULT_FILTERS, SORT_ALIASES } from '../constants';
import { isManualHandover } from './productMeta';

function normalizeSort(sort) {
  return SORT_ALIASES[sort] || sort || 'Most Popular';
}

function applyClientFilters(list, filters = DEFAULT_FILTERS) {
  const range = PRICE_RANGES.find((r) => r.id === filters.price) || PRICE_RANGES[0];
  return list.filter((p) => {
    if (filters.categoryNames?.length) {
      if (!filters.categoryNames.includes(p.cat)) return false;
    } else if (filters.category && filters.category !== 'All' && p.cat !== filters.category) {
      return false;
    }
    if (p.price < range.min || p.price > range.max) return false;
    if (filters.rating && (p.rating == null || p.rating < filters.rating)) return false;
    if (filters.fileTypes?.length && !filters.fileTypes.some((t) => p.fileTypes?.includes(t))) return false;
    if (filters.licenses?.length && !filters.licenses.some((l) => p.licenseIds?.includes(l))) return false;
    if (filters.deliveryTime === 'instant' && isManualHandover(p)) return false;
    if (filters.deliveryTime === 'manual' && !isManualHandover(p)) return false;
    if (filters.verifiedOnly && !p.verifiedSeller) return false;
    if (filters.availability === 'in_stock') {
      if (!p.unlimitedStock && p.stock != null && p.stock <= 0) return false;
    }
    if (filters.availability === 'out_of_stock') {
      if (p.unlimitedStock || p.stock == null || p.stock > 0) return false;
    }
    return true;
  });
}

function applySort(list, sort) {
  const key = normalizeSort(sort);
  const r = [...list];
  switch (key) {
    case 'Price: Low to High':
      return r.sort((a, b) => a.price - b.price);
    case 'Price: High to Low':
      return r.sort((a, b) => b.price - a.price);
    case 'Best Rated':
      return r.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    case 'Oldest':
      return r.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    case 'Newest':
      return r.sort((a, b) => new Date(b.createdAt || b.publishedAt || 0) - new Date(a.createdAt || a.publishedAt || 0));
    case 'Most Popular':
    default:
      return r.sort((a, b) => (b.downloads || b.salesCount || 0) - (a.downloads || a.salesCount || 0));
  }
}

function buildProductQuery({
  page = 1,
  limit = 100,
  search = '',
  category,
  featured,
  seller,
  productType,
  tag,
} = {}) {
  const params = { page, limit };
  if (search?.trim()) params.search = search.trim();
  if (category) params.category = category;
  if (seller) params.seller = seller;
  if (productType) params.productType = productType;
  if (tag) params.tag = tag;
  if (featured === true) params.featured = 'true';
  if (featured === false) params.featured = 'false';
  return params;
}

export async function fetchProducts(params = {}) {
  const query = buildProductQuery(params);
  const key = cacheKey('products', query);
  return cachedRequest(key, async () => {
    const { data, meta } = await get('/products', { params: query });
    const items = Array.isArray(data) ? data.map(mapBackendProduct) : [];
    return { items, meta };
  });
}

export async function fetchProduct(idOrSlug) {
  const key = cacheKey('product', { idOrSlug });
  return cachedRequest(key, async () => {
    const { data } = await get(`/products/${idOrSlug}`);
    return mapBackendProduct(data);
  }, 15_000);
}

export async function fetchCategories(params = { limit: 100 }) {
  const key = cacheKey('categories', params);
  return cachedRequest(key, async () => {
    const { data, meta } = await get('/categories', { params });
    const items = Array.isArray(data) ? data.map(mapBackendCategory) : [];
    return { items, meta };
  }, 60_000);
}

export async function fetchCategory(idOrSlug) {
  const key = cacheKey('category', { idOrSlug });
  return cachedRequest(key, async () => {
    const { data } = await get(`/categories/${idOrSlug}`);
    return mapBackendCategory(data);
  }, 60_000);
}

function resolveListParams({ filters = DEFAULT_FILTERS, query = '', page = 1, limit = 100 } = {}) {
  return {
    page,
    limit,
    search: query,
    category: filters.categoryId || undefined,
    seller: filters.sellerId || undefined,
    featured: filters.featured,
  };
}

/** Storefront productsApi-compatible surface backed by real HTTP. */
export const productsApi = {
  async list({ filters = DEFAULT_FILTERS, sort = 'Most Popular', query = '', page = 1, limit = 100 } = {}) {
    const { items } = await fetchProducts(resolveListParams({ filters, query, page, limit }));
    return applySort(applyClientFilters(items, filters), sort);
  },

  /** Same as list, but also returns backend pagination meta when available. */
  async listPage({ filters = DEFAULT_FILTERS, sort = 'Most Popular', query = '', page = 1, limit = 100 } = {}) {
    const { items, meta } = await fetchProducts(resolveListParams({ filters, query, page, limit }));
    const filtered = applySort(applyClientFilters(items, filters), sort);
    return { items: filtered, meta };
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

  async similar(product, limit = 4) {
    return productsApi.related(product, limit);
  },

  async popular(limit = 12) {
    const { items } = await fetchProducts({ limit: 100 });
    return applySort(items, 'Most Popular').slice(0, limit);
  },

  async recommended(categoryNames = [], excludeId = null, limit = 8) {
    const { items } = await fetchProducts({ limit: 100 });
    const products = items.filter((p) => String(p.id) !== String(excludeId));
    if (categoryNames.length) {
      const matches = products.filter((p) => categoryNames.includes(p.cat));
      if (matches.length >= limit) return applySort(matches, 'Most Popular').slice(0, limit);
      const rest = applySort(products.filter((p) => !categoryNames.includes(p.cat)), 'Most Popular');
      return [...applySort(matches, 'Most Popular'), ...rest].slice(0, limit);
    }
    return applySort(products, 'Most Popular').slice(0, limit);
  },

  async featured(limit = 8) {
    const { items } = await fetchProducts({ featured: true, limit: 40 });
    if (items.length) return items.slice(0, limit);
    return [];
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
            verified: p.verifiedSeller,
            status: p.verifiedSeller ? 'approved' : undefined,
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
    const { items } = await fetchCategories({ limit: 100, status: 'active' });
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

export {
  applyClientFilters,
  applySort,
  normalizeSort,
  buildProductQuery,
};

export default {
  productsApi,
  categoriesApi,
  fetchProducts,
  fetchProduct,
  fetchCategories,
};
