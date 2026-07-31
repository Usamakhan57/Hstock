import { get, post } from '../../lib/apiClient';
import { mapAdminPayment, fetchAllPages } from './adminMappers';

export const getPayments = async (params = {}) => {
  const items = await fetchAllPages(async ({ page, limit }) => {
    const { data, meta } = await get('/payments', { params: { ...params, page, limit } });
    return { items: data, meta };
  });
  return items.map(mapAdminPayment);
};

export const getPayment = async (id) => {
  const { data } = await get(`/payments/${id}`);
  return mapAdminPayment(data);
};

export const syncPayment = async (id) => {
  const { data } = await post(`/payments/${id}/sync`, {});
  return mapAdminPayment(data);
};
