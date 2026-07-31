import { get, post, patch, del } from '../../lib/apiClient';
import { fetchAllPages, idOf } from './adminMappers';

function mapBrand(brand) {
  if (!brand) return null;
  return {
    id: idOf(brand),
    name: brand.name || '',
    slug: brand.slug || '',
    description: brand.description || '',
    logo: brand.logo || brand.image || '',
    status: brand.status || 'active',
    website: brand.website || '',
    createdAt: brand.createdAt,
    raw: brand,
  };
}

export async function getBrands() {
  const items = await fetchAllPages(async ({ page, limit }) => {
    const { data, meta } = await get('/brands', { params: { page, limit } });
    return { items: data, meta };
  });
  return items.map(mapBrand);
}

export async function getBrand(id) {
  const { data } = await get(`/brands/${id}`);
  return mapBrand(data);
}

export async function createBrand(item) {
  const { data } = await post('/brands', item);
  return mapBrand(data);
}

export async function updateBrand(id, patchBody) {
  const { data } = await patch(`/brands/${id}`, patchBody);
  return mapBrand(data);
}

export async function deleteBrand(id) {
  await del(`/brands/${id}`);
  return { deleted: true, id };
}

export async function deleteBrands(ids) {
  await Promise.all(ids.map((id) => del(`/brands/${id}`)));
  return { deleted: ids.length };
}
