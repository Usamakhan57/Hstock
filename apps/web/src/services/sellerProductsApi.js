import { get, post, patch, del, put } from '../lib/apiClient';
import { mapSellerProduct, toBackendProductPayload } from '../lib/mappers/sellerProductMappers';
import { cacheKey, cachedRequest, clearRequestCache } from '../lib/requestCache';

function clearProductCaches() {
  clearRequestCache('seller-products');
  clearRequestCache('seller-product');
  clearRequestCache('products');
  clearRequestCache('product');
  clearRequestCache('seller-inventory');
}

function toInventoryAccounts(accounts = []) {
  return (Array.isArray(accounts) ? accounts : [])
    .filter((row) => row && (row.status === 'uploaded' || row.validation === 'valid' || row.fields))
    .map((row) => {
      const fields = row.fields || {};
      return {
        fields: {
          email: fields.email ?? row.values?.[0] ?? '',
          password: fields.password ?? row.values?.[1] ?? '',
          recovery: fields.recovery ?? row.values?.[2] ?? '',
          '2fa': fields['2fa'] ?? row.values?.[3] ?? '',
          cookie: fields.cookie ?? row.values?.[4] ?? '',
          token: fields.token ?? row.values?.[5] ?? '',
        },
      };
    })
    .filter((row) => Object.values(row.fields).some((value) => String(value ?? '').length > 0));
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

  async create(form, { publish = false, inventoryAccounts = [] } = {}) {
    const payload = toBackendProductPayload(form, { publish });
    const { data } = await post('/products', payload);
    clearProductCaches();
    let product = mapSellerProduct(data);

    if (product?.id && inventoryAccounts.length) {
      await this.replaceInventory(product.id, inventoryAccounts, {
        sourceFormat: form.inventorySourceFormat || 'paste',
      });
      product = await this.get(product.id);
    }

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

  async update(id, form, { publish = false, inventoryAccounts = null } = {}) {
    const payload = toBackendProductPayload(form, { publish });
    const { data } = await patch(`/products/${id}`, payload);
    clearProductCaches();
    let product = mapSellerProduct(data);

    if (product?.id && Array.isArray(inventoryAccounts) && inventoryAccounts.length) {
      await this.replaceInventory(product.id, inventoryAccounts, {
        sourceFormat: form.inventorySourceFormat || 'paste',
      });
      product = await this.get(product.id);
    }

    if (publish && product?.id && ['draft', 'rejected'].includes(product.status)) {
      try {
        return await this.submit(product.id);
      } catch {
        return product;
      }
    }
    return product;
  },

  async replaceInventory(id, accounts, { sourceFormat = 'paste', mode = 'replace_available' } = {}) {
    const payload = {
      accounts: toInventoryAccounts(accounts),
      sourceFormat,
      mode,
    };
    if (!payload.accounts.length) {
      throw new Error('No valid inventory accounts to upload');
    }
    const { data } = await put(`/products/${id}/inventory`, payload);
    clearProductCaches();
    return data;
  },

  async listInventory(id, { includeSold = false } = {}) {
    const key = cacheKey('seller-inventory', { id, includeSold });
    return cachedRequest(key, async () => {
      const { data } = await get(`/products/${id}/inventory`, {
        params: includeSold ? { includeSold: 'true' } : undefined,
      });
      return data;
    }, 4_000);
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
