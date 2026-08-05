import { get, post } from '../lib/apiClient';

export const sellerVerificationApi = {
  async getStatus() {
    const { data } = await get('/seller-verification/me');
    return data;
  },

  async purchase() {
    const { data } = await post('/seller-verification/me/purchase', {});
    return data;
  },

  async adminList({ page = 1, limit = 50, search, verified } = {}) {
    const params = { page, limit };
    if (search) params.search = search;
    if (verified) params.verified = verified;
    const { data, meta } = await get('/seller-verification', { params });
    return { items: Array.isArray(data) ? data : [], meta };
  },

  async adminVerify(id) {
    const { data } = await post(`/seller-verification/${id}/verify`, {});
    return data;
  },

  async adminUnverify(id, { refund = false } = {}) {
    const { data } = await post(`/seller-verification/${id}/unverify`, { refund });
    return data;
  },
};

export default sellerVerificationApi;
