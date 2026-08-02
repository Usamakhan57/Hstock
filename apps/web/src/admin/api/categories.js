import { get, post, patch, del } from '../../lib/apiClient';
import { getDescendants } from '../../services/categoryTree';
import { fetchAllPages, idOf } from './adminMappers';
import { hydrateCatalog } from '../../services/catalogCache';

function emptyToNull(value) {
  if (value === '' || value === undefined) return null;
  return value;
}

function mapCategory(category) {
  if (!category) return null;
  return {
    id: idOf(category),
    name: category.name || '',
    slug: category.slug || '',
    parentId: idOf(category.parent) || category.parentId || null,
    description: category.description || '',
    image: category.image || '',
    icon: category.icon || 'Sparkles',
    status: category.status || 'active',
    featured: !!category.featured,
    showInHeader: category.showInHeader !== false,
    showOnHomepage: !!category.showOnHomepage,
    displayOrder: category.displayOrder ?? 0,
    seoTitle: category.seoTitle || '',
    metaDescription: category.seoDescription || category.metaDescription || '',
    ogImage: category.ogImage || '',
    deletedAt: category.deletedAt || null,
    createdAt: category.createdAt,
    raw: category,
  };
}

function toApiBody(item = {}) {
  const body = {};
  if (item.name !== undefined) body.name = item.name;
  if (item.slug !== undefined) body.slug = item.slug || undefined;
  if (item.description !== undefined) body.description = item.description || '';
  if (item.image !== undefined) body.image = emptyToNull(item.image);
  if (item.icon !== undefined) body.icon = emptyToNull(item.icon);
  if (item.parentId !== undefined) body.parent = emptyToNull(item.parentId);
  if (item.parent !== undefined) body.parent = emptyToNull(item.parent);
  if (item.displayOrder !== undefined) body.displayOrder = Number(item.displayOrder) || 0;
  if (item.status !== undefined) body.status = item.status || 'active';
  if (item.featured !== undefined) body.featured = !!item.featured;
  if (item.showInHeader !== undefined) body.showInHeader = !!item.showInHeader;
  if (item.showOnHomepage !== undefined) body.showOnHomepage = !!item.showOnHomepage;
  if (item.seoTitle !== undefined) body.seoTitle = emptyToNull(item.seoTitle);
  if (item.metaDescription !== undefined) body.seoDescription = emptyToNull(item.metaDescription);
  if (item.seoDescription !== undefined) body.seoDescription = emptyToNull(item.seoDescription);
  if (item.ogImage !== undefined) body.ogImage = emptyToNull(item.ogImage);
  return body;
}

async function refreshStorefrontCatalog() {
  try {
    await hydrateCatalog({ force: true });
  } catch {
    // Storefront cache refresh is best-effort after admin mutations.
  }
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
  const { data } = await post('/categories', toApiBody({
    ...item,
    status: item.status || 'active',
    showOnHomepage: item.showOnHomepage ?? true,
    showInHeader: item.showInHeader ?? true,
  }));
  await refreshStorefrontCatalog();
  return mapCategory(data);
}

export async function updateCategory(id, patchBody) {
  const { data } = await patch(`/categories/${id}`, toApiBody(patchBody));
  await refreshStorefrontCatalog();
  return mapCategory(data);
}

export async function trashCategory(id) {
  await del(`/categories/${id}`);
  await refreshStorefrontCatalog();
  return { trashed: true, id };
}

export async function restoreCategory(id) {
  // Soft-deleted docs are restored by clearing deletedAt via update path.
  const { data } = await patch(`/categories/${id}`, { deletedAt: null, status: 'active' });
  // If API rejects deleted docs on PATCH, fall through with create-from-trash unavailable —
  // restore uses a dedicated filter bypass in update when deletedAt is provided.
  await refreshStorefrontCatalog();
  return mapCategory(data);
}

export async function permanentlyDeleteCategory(id) {
  await del(`/categories/${id}`);
  await refreshStorefrontCatalog();
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
