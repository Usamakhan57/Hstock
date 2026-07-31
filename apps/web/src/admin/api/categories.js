import { createResource } from './db';
import { seedCategories } from './seedData';
import { getDescendants } from '../../services/categoryTree';

const resource = createResource('categories', seedCategories);

export const getCategory = resource.getById;

/** Non-trashed categories — what the Admin list, Product Form, and every frontend read should ever see. */
export async function getCategories() {
  const all = await resource.getAll();
  return all.filter((c) => !c.deletedAt);
}

/** Trashed categories only — backs the Trash view. */
export async function getTrashedCategories() {
  const all = await resource.getAll();
  return all.filter((c) => !!c.deletedAt);
}

export async function createCategory(item) {
  return resource.create({ deletedAt: null, parentId: null, ...item });
}

export const updateCategory = resource.update;

// --- Soft delete / Trash -------------------------------------------------
// A category can't be trashed while it still has live children or
// products attached — the caller (Admin UI) checks that first via
// canDeleteCategory() and shows a warning instead of calling trashCategory.

export async function trashCategory(id) {
  return resource.update(id, { deletedAt: new Date().toISOString() });
}

export async function restoreCategory(id) {
  return resource.update(id, { deletedAt: null });
}

export async function permanentlyDeleteCategory(id) {
  return resource.remove(id);
}

/**
 * Whether a category is safe to move to Trash: no live child categories,
 * and (if `productCountByCategoryId` is supplied) no products attached.
 * Returns { ok: true } or { ok: false, reason } so the caller can show a
 * specific warning rather than a generic failure.
 */
export async function canDeleteCategory(id, productCountByCategoryId = {}) {
  const all = await getCategories();
  const children = getDescendants(all, id);
  if (children.length > 0) {
    return { ok: false, reason: `This category has ${children.length} subcategor${children.length === 1 ? 'y' : 'ies'}. Move or delete them first.` };
  }
  const productCount = productCountByCategoryId[id] || 0;
  if (productCount > 0) {
    return { ok: false, reason: `This category has ${productCount} product${productCount === 1 ? '' : 's'} assigned. Reassign them first.` };
  }
  return { ok: true };
}
