import { get, post } from '../../lib/apiClient';

export async function listSellerVerifications(params = {}) {
  const { data, meta } = await get('/seller-verification', { params });
  return { items: Array.isArray(data) ? data : [], meta };
}

export async function verifySeller(id) {
  const { data } = await post(`/seller-verification/${id}/verify`, {});
  return data;
}

export async function unverifySeller(id, { refund = false } = {}) {
  const { data } = await post(`/seller-verification/${id}/unverify`, { refund });
  return data;
}

export default {
  listSellerVerifications,
  verifySeller,
  unverifySeller,
};
