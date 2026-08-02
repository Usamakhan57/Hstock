import { get, post } from '../lib/apiClient';
import { mapBackendPayment } from '../lib/mappers/commerceMappers';
import { cacheKey, cachedRequest, clearRequestCache } from '../lib/requestCache';

export const paymentsApi = {
  async list({ page = 1, limit = 20, status, scope, orderId } = {}) {
    const params = { page, limit };
    if (status) params.status = status;
    if (scope) params.scope = scope;
    if (orderId) params.orderId = orderId;
    const key = cacheKey('payments', params);
    return cachedRequest(key, async () => {
      const { data, meta } = await get('/payments', { params });
      const items = Array.isArray(data) ? data.map(mapBackendPayment) : [];
      return { items, meta };
    }, 10_000);
  },

  async get(id) {
    const { data } = await get(`/payments/${id}`);
    return mapBackendPayment(data);
  },

  async sync(id) {
    const { data } = await post(`/payments/${id}/sync`, {});
    clearRequestCache('payments');
    clearRequestCache('orders');
    return mapBackendPayment(data);
  },

  /**
   * Dynamic Cryptomus currencies + networks for checkout.
   * Falls back to offline catalog when the API is unreachable.
   */
  async listCheckoutAssets() {
    const key = cacheKey('payments', { scope: 'checkout-assets' });
    return cachedRequest(key, async () => {
      const { data, meta } = await get('/payments/cryptomus/checkout-assets');
      return {
        assets: Array.isArray(data) ? data : [],
        source: meta?.source || 'cryptomus',
        mode: meta?.mode || null,
      };
    }, 60_000);
  },
};

export default paymentsApi;
