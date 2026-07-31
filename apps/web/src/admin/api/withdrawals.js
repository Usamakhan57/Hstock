import { get, post } from '../../lib/apiClient';
import { mapAdminWithdrawal, fetchAllPages } from './adminMappers';

export const getWithdrawals = async (params = {}) => {
  const items = await fetchAllPages(async ({ page, limit }) => {
    const { data, meta } = await get('/withdrawals', { params: { ...params, page, limit } });
    return { items: data, meta };
  });
  return items.map(mapAdminWithdrawal);
};

export const getWithdrawal = async (id) => {
  const { data } = await get(`/withdrawals/${id}`);
  return mapAdminWithdrawal(data);
};

export const approveWithdrawal = async (id) => {
  const { data } = await post(`/withdrawals/${id}/approve`, {});
  return mapAdminWithdrawal(data);
};

export const rejectWithdrawal = async (id, payload = {}) => {
  const { data } = await post(`/withdrawals/${id}/reject`, payload);
  return mapAdminWithdrawal(data);
};

export const payWithdrawal = async (id) => {
  const { data } = await post(`/withdrawals/${id}/pay`, {});
  return mapAdminWithdrawal(data);
};
