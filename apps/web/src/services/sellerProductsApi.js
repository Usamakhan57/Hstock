import { get, post, patch, del } from '../lib/apiClient';
import { mapSellerProduct, toBackendProductPayload } from '../lib/mappers/sellerProductMappers';
import { cacheKey, cachedRequest, clearRequestCache } from '../lib/requestCache';

function clearProductCaches() {
  clearRequestCache('seller-products');
  clearRequestCache('seller-product');
  clearRequestCache('products');
  clearRequestCache('product');
}

export const sellerProductsApi = {
  async list({ page = 1, limit = 100, search, status } = {}) {
    const params = { page, limit, mine: 'true' };
    if (search) params.search = search;
    if (status && status !== 'all') params.status = status;
    const key = cacheKey('seller-products', params);
    return cachedRequest(key, async () => {
      const { data, meta } = await get('/products', { params });
      const items = Array.isArray(data) ? data.map(mapSellerProduct) : [];
      return { items, meta };
    }, 8_000);
  },

  async get(id) {
    const key = cacheKey('seller-product', { id });
    return cachedRequest(key, async () => {
      const { data } = await get(`/products/${id}`);
      return mapSellerProduct(data);
    }, 4_000);
  },

  async create(form, { publish = false } = {}) {
    const payload = toBackendProductPayload(form, { publish });
    const { data } = await post('/products', payload);
    clearProductCaches();
    const product = mapSellerProduct(data);
    if (publish && product?.id && product.status === 'draft') {
      try {
        const submitted = await this.submit(product.id);
        return submitted;
      } catch {
        return product;
      }
    }
    return product;
  },

  async update(id, form, { publish = false } = {}) {
    const payload = toBackendProductPayload(form, { publish });
    const { data } = await patch(`/products/${id}`, payload);
    clearProductCaches();
    const product = mapSellerProduct(data);
    if (publish && product?.id && ['draft', 'rejected'].includes(product.status)) {
      try {
        return await this.submit(product.id);
      } catch {
        return product;
      }
    }
    return product;
  },

  async remove(id) {
    const { data } = await del(`/products/${id}`);
    clearProductCaches();
    return mapSellerProduct(data) || { id };
  },

  async submit(id) {
    const { data } = await post(`/products/${id}/submit`, {});
    clearProductCaches();
    return mapSellerProduct(data);
  },
};

export default sellerProductsApi;
