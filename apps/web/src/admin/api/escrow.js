import { get, post } from '../../lib/apiClient';
import { mapAdminEscrow, fetchAllPages } from './adminMappers';

export const getEscrows = async (params = {}) => {
  const items = await fetchAllPages(async ({ page, limit }) => {
    const { data, meta } = await get('/escrow', { params: { ...params, page, limit } });
    return { items: data, meta };
  });
  return items.map(mapAdminEscrow);
};

export const getEscrow = async (id) => {
  const { data } = await get(`/escrow/${id}`);
  return mapAdminEscrow(data);
};

export const releaseEscrow = async (id, payload = {}) => {
  const { data } = await post(`/escrow/${id}/release`, payload);
  return mapAdminEscrow(data);
};
