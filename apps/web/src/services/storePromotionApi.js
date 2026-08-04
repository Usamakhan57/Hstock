import { get, post } from '../lib/apiClient';

export const storePromotionApi = {
  async getStatus() {
    const { data } = await get('/store-promotions/me');
    return data;
  },

  async purchase() {
    const { data } = await post('/store-promotions/me/purchase', {});
    return data;
  },
};

export default storePromotionApi;
