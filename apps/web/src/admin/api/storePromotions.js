import { get, post } from '../../lib/apiClient';

export async function listStorePromotions(params = {}) {
  const { data, meta } = await get('/store-promotions', { params });
  return { items: Array.isArray(data) ? data : [], meta };
}

export async function getPromotionAnalytics() {
  const { data } = await get('/store-promotions/analytics');
  return data;
}

export async function extendPromotion(id, hours) {
  const { data } = await post(`/store-promotions/${id}/extend`, { hours: Number(hours) });
  return data;
}

export async function cancelPromotion(id, reason) {
  const { data } = await post(`/store-promotions/${id}/cancel`, reason ? { reason } : {});
  return data;
}

export default {
  listStorePromotions,
  getPromotionAnalytics,
  extendPromotion,
  cancelPromotion,
};
