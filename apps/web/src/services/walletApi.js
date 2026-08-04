import { get } from '../lib/apiClient';
import { mapBackendWallet, mapBackendLedgerEntry } from '../lib/mappers/commerceMappers';
import { cacheKey, cachedRequest, clearRequestCache } from '../lib/requestCache';

export const walletApi = {
  async me({ force = false } = {}) {
    if (force) clearRequestCache('wallet');
    const key = cacheKey('wallet', { me: true });
    return cachedRequest(key, async () => {
      const { data } = await get('/wallet/me');
      return mapBackendWallet(data);
    }, force ? 0 : 10_000);
  },

  async transactions({ page = 1, limit = 50, force = false } = {}) {
    if (force) clearRequestCache('wallet-tx');
    const params = { page, limit };
    const key = cacheKey('wallet-tx', params);
    return cachedRequest(key, async () => {
      const { data, meta } = await get('/wallet/me/transactions', { params });
      const items = Array.isArray(data) ? data.map(mapBackendLedgerEntry) : [];
      return { items, meta };
    }, force ? 0 : 10_000);
  },

  async ledger({ page = 1, limit = 50, orderId } = {}) {
    const params = { page, limit };
    if (orderId) params.orderId = orderId;
    const key = cacheKey('wallet-ledger', params);
    return cachedRequest(key, async () => {
      const { data, meta } = await get('/wallet/ledger', { params });
      const items = Array.isArray(data) ? data.map(mapBackendLedgerEntry) : [];
      return { items, meta };
    }, 10_000);
  },
};

export default walletApi;
