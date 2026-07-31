import { get, post, patch, del } from '../../lib/apiClient';
import { getDescendants } from '../../services/categoryTree';
import { fetchAllPages, idOf } from './adminMappers';

function mapCategory(category) {
  if (!category) return null;
  return {
    id: idOf(category),
    name: category.name || '',
    slug: category.slug || '',
    parentId: idOf(category.parent) || category.parentId || null,
    description: category.description || '',
    status: category.status || 'active',
    displayOrder: category.displayOrder ?? 0,
    deletedAt: category.deletedAt || null,
    createdAt: category.createdAt,
    raw: category,
  };
}

export async function getCategories() {
  const items = await fetchAllPages(async ({ page, limit }) => {
    const { data, meta } = await get('/categories', { params: { page, limit } });
    return { items: data, meta };
  });
  return items.map(mapCategory).filter((c) => !c.deletedAt);
}

export async function getTrashedCategories() {
  const items = await fetchAllPages(async ({ page, limit }) => {
    const { data, meta } = await get('/categories', {
      params: { page, limit, includeDeleted: true },
    });
    return { items: data, meta };
  });
  return items.map(mapCategory).filter((c) => !!c.deletedAt);
}

export async function getCategory(id) {
  const { data } = await get(`/categories/${id}`);
  return mapCategory(data);
}

export async function createCategory(item) {
  const { data } = await post('/categories', {
    name: item.name,
    slug: item.slug,
    parent: item.parentId || undefined,
    description: item.description,
    status: item.status || 'active',
    displayOrder: item.displayOrder,
  });
  return mapCategory(data);
}

export async function updateCategory(id, patchBody) {
  const body = { ...patchBody };
  if (body.parentId !== undefined) {
    body.parent = body.parentId;
    delete body.parentId;
  }
  const { data } = await patch(`/categories/${id}`, body);
  return mapCategory(data);
}

export async function trashCategory(id) {
  return updateCategory(id, { deletedAt: new Date().toISOString(), status: 'inactive' });
}

export async function restoreCategory(id) {
  return updateCategory(id, { deletedAt: null, status: 'active' });
}

export async function permanentlyDeleteCategory(id) {
  await del(`/categories/${id}`);
  return { deleted: true, id };
}

export async function canDeleteCategory(id, productCountByCategoryId = {}) {
  const all = await getCategories();
  const children = getDescendants(all, id);
  if (children.length > 0) {
    return {
      ok: false,
      reason: `This category has ${children.length} subcategor${children.length === 1 ? 'y' : 'ies'}. Move or delete them first.`,
    };
  }
  const productCount = productCountByCategoryId[id] || 0;
  if (productCount > 0) {
    return {
      ok: false,
      reason: `This category has ${productCount} product${productCount === 1 ? '' : 's'} assigned. Reassign them first.`,
    };
  }
  return { ok: true };
}
