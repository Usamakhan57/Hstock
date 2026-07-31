import { get, post } from '../../lib/apiClient';
import { mapAdminOrder, fetchAllPages } from './adminMappers';

export const getOrders = async () => {
  const items = await fetchAllPages(async ({ page, limit }) => {
    const { data, meta } = await get('/orders', { params: { page, limit } });
    return { items: data, meta };
  });
  return items.map(mapAdminOrder);
};

export const getOrder = async (id) => {
  const key = String(id).replace(/^ord-/, '');
  const { data } = await get(`/orders/${key}`);
  return mapAdminOrder(data);
};

export const createOrder = async () => {
  throw new Error('Creating orders via admin API is not supported.');
};

export const updateOrder = async (id, payload) => {
  const existing = await getOrder(id);
  if (payload.paymentStatus === 'refunded') {
    return refundOrder(id);
  }
  return {
    ...existing,
    status: payload.status || existing.status,
    paymentStatus: payload.paymentStatus || existing.paymentStatus,
  };
};

export const refundOrder = async (id) => {
  const existing = await getOrder(id);
  const orderId = existing._id || String(id).replace(/^ord-/, '');
  await post('/refunds', {
    orderId,
    type: 'full',
    reason: 'Admin refund',
  });
  return getOrder(id);
};

export const deleteOrder = async () => {
  throw new Error('Deleting orders via admin API is not supported.');
};
