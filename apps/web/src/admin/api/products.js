import { get, post, patch, del } from '../../lib/apiClient';
import { mapAdminProduct, fetchAllPages } from './adminMappers';

export const getProducts = async () => {
  const items = await fetchAllPages(async ({ page, limit }) => {
    const { data, meta } = await get('/products', { params: { page, limit } });
    return { items: data, meta };
  });
  return items.map(mapAdminProduct);
};

export const getProduct = async (id) => {
  const { data } = await get(`/products/${id}`);
  return mapAdminProduct(data);
};

export const createProduct = async (payload) => {
  const { data } = await post('/products', payload);
  return mapAdminProduct(data);
};

export const updateProduct = async (id, payload) => {
  const body = { ...payload };
  if (body.status === 'active') body.status = 'live';
  if (body.status === 'draft') body.status = 'draft';
  const { data } = await patch(`/products/${id}`, body);
  return mapAdminProduct(data);
};

export const deleteProduct = async (id) => {
  await del(`/products/${id}`);
  return { deleted: true, id };
};

export const deleteProducts = async (ids) => {
  await Promise.all(ids.map((id) => del(`/products/${id}`)));
  return { deleted: ids.length };
};

export const moderateProduct = async (id, payload) => {
  const { data } = await post(`/products/${id}/moderate`, payload);
  return mapAdminProduct(data);
};

export const approveProduct = (id) => moderateProduct(id, { approvalStatus: 'approved' });
export const rejectProduct = (id) => moderateProduct(id, { approvalStatus: 'rejected' });
