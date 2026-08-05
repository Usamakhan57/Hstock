import { get, post, patch, del } from '../../lib/apiClient';
import { mapAdminProduct, fetchAllPages } from './adminMappers';
import { clearRequestCache } from '../../lib/requestCache';
import { hydrateCatalog } from '../../services/catalogCache';

async function bustStorefrontCatalogCache() {
  clearRequestCache('products');
  clearRequestCache('product');
  try {
    await hydrateCatalog({ force: true });
  } catch {
    // Storefront cache refresh is best-effort from admin mutations.
  }
}

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
  const body = { ...payload };
  if (body.status === 'active') {
    body.status = 'live';
    body.approvalStatus = body.approvalStatus || 'approved';
    body.visibility = body.visibility || 'public';
  }
  const { data } = await post('/products', body);
  await bustStorefrontCatalogCache();
  return mapAdminProduct(data);
};

export const updateProduct = async (id, payload) => {
  const body = { ...payload };
  if (body.status === 'active') {
    body.status = 'live';
    // Admin Publish must unlock public catalog (live + approved + public).
    body.approvalStatus = body.approvalStatus || 'approved';
    body.visibility = body.visibility || 'public';
  }
  if (body.status === 'draft') body.status = 'draft';
  const { data } = await patch(`/products/${id}`, body);
  await bustStorefrontCatalogCache();
  return mapAdminProduct(data);
};

export const deleteProduct = async (id) => {
  await del(`/products/${id}`);
  await bustStorefrontCatalogCache();
  return { deleted: true, id };
};

export const deleteProducts = async (ids) => {
  await Promise.all(ids.map((id) => del(`/products/${id}`)));
  await bustStorefrontCatalogCache();
  return { deleted: ids.length };
};

export const moderateProduct = async (id, payload) => {
  const { data } = await post(`/products/${id}/moderate`, payload);
  await bustStorefrontCatalogCache();
  return mapAdminProduct(data);
};

export const approveProduct = (id) => moderateProduct(id, { approvalStatus: 'approved' });
export const rejectProduct = (id) => moderateProduct(id, { approvalStatus: 'rejected' });
