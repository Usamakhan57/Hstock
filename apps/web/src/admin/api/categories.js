import { get, post, patch, del } from '../../lib/apiClient';
import { uploadProductImage } from '../../lib/imageUpload';
import { getDescendants } from '../../services/categoryTree';
import { fetchAllPages, idOf } from './adminMappers';
import { hydrateCatalog } from '../../services/catalogCache';

/** Backend category image fields reject strings longer than this. */
export const CATEGORY_IMAGE_MAX_CHARS = 4000;

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

/**
 * Convert a data-URL string into a File suitable for /uploads/images.
 * @param {string} dataUrl
 * @param {string} [filename]
 */
export async function dataUrlToFile(dataUrl, filename = 'category-image.png') {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const type = blob.type || 'image/png';
  const ext = type.includes('jpeg') || type.includes('jpg')
    ? '.jpg'
    : type.includes('webp')
      ? '.webp'
      : '.png';
  const safeName = filename.includes('.') ? filename : `${filename}${ext}`;
  return new File([blob], safeName, { type });
}

function isUsableCategoryImageUrl(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > CATEGORY_IMAGE_MAX_CHARS) return false;
  if (trimmed.toLowerCase().startsWith('data:')) return false;
  return /^(https?:\/\/|\/)/i.test(trimmed);
}

/**
 * Normalize a category image/ogImage value to a short URL string (or '').
 * Never returns base64, File/Blob wrappers, or upload metadata objects.
 *
 * - '' / null / undefined → ''
 * - http(s) or /path URL within length limit → trimmed URL
 * - data: URL → upload via /uploads/images, return server URL
 * - File / Blob → upload, return server URL
 * - { url: string } → recurse on url
 */
export async function resolveCategoryImageRef(value, { field = 'image' } = {}) {
  if (value == null || value === '') return '';

  if (typeof value === 'object') {
    if (typeof File !== 'undefined' && value instanceof File) {
      const uploaded = await uploadProductImage(value);
      return String(uploaded.url || '');
    }
    if (typeof Blob !== 'undefined' && value instanceof Blob) {
      const file = new File([value], `category-${field}.png`, {
        type: value.type || 'image/png',
      });
      const uploaded = await uploadProductImage(file);
      return String(uploaded.url || '');
    }
    if (typeof value.url === 'string') {
      return resolveCategoryImageRef(value.url, { field });
    }
    throw new Error(`Category ${field} must be a URL string, not an object.`);
  }

  if (typeof value !== 'string') {
    throw new Error(`Category ${field} must be a URL string.`);
  }

  const trimmed = value.trim();
  if (!trimmed) return '';

  if (trimmed.toLowerCase().startsWith('data:')) {
    const file = await dataUrlToFile(trimmed, `category-${field}`);
    const uploaded = await uploadProductImage(file);
    return String(uploaded.url || '');
  }

  if (!isUsableCategoryImageUrl(trimmed)) {
    throw new Error(
      `Category ${field} must be an http(s) URL or site path (max ${CATEGORY_IMAGE_MAX_CHARS} characters). `
      + 'Upload an image instead of pasting a large or embedded value.',
    );
  }

  return trimmed;
}

/**
 * Build the category create/update JSON body.
 * Image fields must already be resolved to URL strings (or empty).
 */
export function toApiBody(item = {}) {
  const body = {};
  if (item.name !== undefined) body.name = item.name;
  if (item.slug !== undefined) {
    const slug = typeof item.slug === 'string' ? item.slug.trim() : item.slug;
    if (slug) body.slug = slug;
  }
  if (item.description !== undefined) {
    body.description = item.description == null ? '' : String(item.description);
  }
  if (item.image !== undefined) body.image = emptyToNull(item.image);
  if (item.icon !== undefined) body.icon = emptyToNull(item.icon);
  if (item.parentId !== undefined) body.parent = emptyToNull(item.parentId);
  if (item.parent !== undefined) body.parent = emptyToNull(item.parent);
  if (item.displayOrder !== undefined) {
    const n = Number(item.displayOrder);
    body.displayOrder = Number.isFinite(n) ? Math.trunc(n) : 0;
  }
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

/**
 * Resolve image/ogImage then map to API body.
 * @param {object} item form or patch fields
 * @param {{ previous?: { image?: string, ogImage?: string } }} [options]
 *   When previous is provided and image/ogImage are unchanged usable URLs,
 *   those fields are kept as the existing URL (no re-upload).
 */
export async function prepareCategoryApiBody(item = {}, { previous } = {}) {
  const next = { ...item };

  if (item.image !== undefined) {
    const prevImage = previous?.image || '';
    if (
      typeof item.image === 'string'
      && item.image === prevImage
      && isUsableCategoryImageUrl(item.image)
    ) {
      next.image = item.image.trim();
    } else {
      next.image = await resolveCategoryImageRef(item.image, { field: 'image' });
    }
  }

  if (item.ogImage !== undefined) {
    const prevOg = previous?.ogImage || '';
    if (
      typeof item.ogImage === 'string'
      && item.ogImage === prevOg
      && isUsableCategoryImageUrl(item.ogImage)
    ) {
      next.ogImage = item.ogImage.trim();
    } else {
      next.ogImage = await resolveCategoryImageRef(item.ogImage, { field: 'ogImage' });
    }
  }

  const body = toApiBody(next);

  // Safe diagnostic: length + prefix only (never log full data URLs).
  if (typeof console !== 'undefined' && typeof console.debug === 'function') {
    console.debug('[categories] PATCH/POST payload image fields', {
      imageType: body.image == null ? 'null' : typeof body.image,
      imageLength: body.image == null ? 0 : String(body.image).length,
      imagePrefix: body.image == null ? null : String(body.image).slice(0, 48),
      ogImageType: body.ogImage == null ? 'null' : typeof body.ogImage,
      ogImageLength: body.ogImage == null ? 0 : String(body.ogImage).length,
      ogImagePrefix: body.ogImage == null ? null : String(body.ogImage).slice(0, 48),
    });
  }

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
  const body = await prepareCategoryApiBody({
    ...item,
    status: item.status || 'active',
    showOnHomepage: item.showOnHomepage ?? true,
    showInHeader: item.showInHeader ?? true,
  });
  const { data } = await post('/categories', body);
  await refreshStorefrontCatalog();
  return mapCategory(data);
}

export async function updateCategory(id, patchBody, options = {}) {
  const body = await prepareCategoryApiBody(patchBody, {
    previous: options.previous,
  });
  const { data } = await patch(`/categories/${id}`, body);
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
