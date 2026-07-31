import { get, post } from '../../lib/apiClient';
import { mapAdminDispute, fetchAllPages } from './adminMappers';
import { mapBackendDispute, mapDisputeDashboard } from '../../lib/mappers/disputeMappers';

export const getDisputes = async (params = {}) => {
  const items = await fetchAllPages(async ({ page, limit }) => {
    const { data, meta } = await get('/disputes', { params: { ...params, page, limit } });
    return { items: data, meta };
  });
  return items.map(mapAdminDispute);
};

export const getDispute = async (id) => {
  const { data } = await get(`/disputes/${id}`);
  return mapBackendDispute(data);
};

export const getDisputeDashboard = async (id) => {
  const { data } = await get(`/disputes/${id}/dashboard`);
  return mapDisputeDashboard(data);
};

export const resolveDispute = async (id, payload) => {
  const { data } = await post(`/disputes/${id}/resolve`, payload);
  return mapBackendDispute(data);
};
