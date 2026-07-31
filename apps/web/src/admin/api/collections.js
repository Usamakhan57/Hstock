import { get, post, patch, del } from '../../lib/apiClient';
import { fetchAllPages, idOf } from './adminMappers';

function mapCollection(collection) {
  if (!collection) return null;
  return {
    id: idOf(collection),
    name: collection.name || '',
    slug: collection.slug || '',
    description: collection.description || '',
    status: collection.status || 'active',
    featured: !!collection.featured,
    image: collection.image || collection.thumbnail || '',
    createdAt: collection.createdAt,
    raw: collection,
  };
}

export async function getCollections() {
  const items = await fetchAllPages(async ({ page, limit }) => {
    const { data, meta } = await get('/collections', { params: { page, limit } });
    return { items: data, meta };
  });
  return items.map(mapCollection);
}

export async function getCollection(id) {
  const { data } = await get(`/collections/${id}`);
  return mapCollection(data);
}

export async function createCollection(item) {
  const { data } = await post('/collections', item);
  return mapCollection(data);
}

export async function updateCollection(id, patchBody) {
  const { data } = await patch(`/collections/${id}`, patchBody);
  return mapCollection(data);
}

export async function deleteCollection(id) {
  await del(`/collections/${id}`);
  return { deleted: true, id };
}

export async function deleteCollections(ids) {
  await Promise.all(ids.map((id) => del(`/collections/${id}`)));
  return { deleted: ids.length };
}
