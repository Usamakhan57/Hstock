import { get } from '../lib/apiClient';
import { mapBackendEscrow } from '../lib/mappers/commerceMappers';
import { cacheKey, cachedRequest } from '../lib/requestCache';

export const escrowApi = {
  async list({ page = 1, limit = 50, status } = {}) {
    const params = { page, limit };
    if (status) params.status = status;
    const key = cacheKey('escrow', params);
    return cachedRequest(key, async () => {
      const { data, meta } = await get('/escrow', { params });
      const items = Array.isArray(data) ? data.map(mapBackendEscrow) : [];
      return { items, meta };
    }, 10_000);
  },

  async get(id) {
    const { data } = await get(`/escrow/${id}`);
    return mapBackendEscrow(data);
  },
};

export default escrowApi;
