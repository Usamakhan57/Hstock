import { get, post } from '../lib/apiClient';
import { mapBackendWithdrawal } from '../lib/mappers/commerceMappers';
import { cacheKey, cachedRequest, clearRequestCache } from '../lib/requestCache';

export const withdrawalsApi = {
  async list({ page = 1, limit = 50 } = {}) {
    const params = { page, limit };
    const key = cacheKey('withdrawals', params);
    return cachedRequest(key, async () => {
      const { data, meta } = await get('/withdrawals', { params });
      const items = Array.isArray(data) ? data.map(mapBackendWithdrawal) : [];
      return { items, meta };
    }, 10_000);
  },

  async get(id) {
    const { data } = await get(`/withdrawals/${id}`);
    return mapBackendWithdrawal(data);
  },

  async create({ coin, network, walletAddress, amount }) {
    const { data } = await post('/withdrawals', {
      coin,
      network,
      walletAddress,
      amount: Number(amount),
    });
    clearRequestCache('withdrawals');
    clearRequestCache('wallet');
    return mapBackendWithdrawal(data);
  },

  async cancel(id) {
    const { data } = await post(`/withdrawals/${id}/cancel`, {});
    clearRequestCache('withdrawals');
    clearRequestCache('wallet');
    return mapBackendWithdrawal(data);
  },
};

export default withdrawalsApi;
