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
};

export default paymentsApi;
