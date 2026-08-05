import { Category, Brand, Tag } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { toSlug } from '../utils/slug.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { objectIdSchema } from '../validators/common.validator.js';

async function ensureUniqueSlug(Model, base, excludeId = null) {
  let slug = toSlug(base);
  if (!slug) slug = 'item';
  let attempt = 0;
  while (true) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt}`;
    const filter = { slug: candidate };
    if (excludeId) filter._id = { $ne: excludeId };
    // eslint-disable-next-line no-await-in-loop
    const exists = await Model.findOne(filter).select('_id').lean();
    if (!exists) return candidate;
    attempt += 1;
  }
}

function isObjectId(value) {
  return objectIdSchema.safeParse(String(value ?? '')).success;
}

async function getByIdOrSlug(Model, idOrSlug, notFoundMessage) {
  const filter = isObjectId(idOrSlug)
    ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
    : { slug: idOrSlug };

  const doc = await Model.findOne({ ...filter, deletedAt: null }).lean();
  if (!doc) {
    throw new AppError(notFoundMessage, 404, { code: 'NOT_FOUND' });
  }
  return doc;
}

// ─── Categories ─────────────────────────────────────────────────────────────

export async function listCategories(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.includeDeleted === 'true') {
    filter.deletedAt = { $ne: null };
  } else {
    filter.deletedAt = null;
  }
  if (query.status) filter.status = query.status;
  if (query.parent === 'null') filter.parent = null;
  else if (query.parent) filter.parent = query.parent;
  if (query.featured !== undefined) filter.featured = query.featured === 'true';
  if (query.showOnHomepage !== undefined) filter.showOnHomepage = query.showOnHomepage === 'true';
  if (query.search) {
    const needle = String(query.search).trim();
    if (needle) {
      const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'i');
      filter.$or = [{ name: re }, { slug: re }, { description: re }];
    }
  }

  const [items, total] = await Promise.all([
    Category.find(filter).sort({ name: 1, displayOrder: 1 }).skip(skip).limit(limit).lean(),
    Category.countDocuments(filter),
  ]);

  return { items, meta: buildPaginationMeta({ page, limit, total }) };
}

export async function getCategory(idOrSlug) {
  return getByIdOrSlug(Category, idOrSlug, 'Category not found');
}

export async function createCategory(payload, userId) {
  const slug = await ensureUniqueSlug(Category, payload.slug || payload.name);
  const category = await Category.create({
    ...payload,
    slug,
    createdBy: userId,
    updatedBy: userId,
  });
  return category.toObject();
}

export async function updateCategory(id, payload, userId) {
  // Allow restoring soft-deleted categories when deletedAt is explicitly null.
  const allowDeleted = Object.prototype.hasOwnProperty.call(payload, 'deletedAt')
    && payload.deletedAt === null;
  const category = await Category.findOne(
    allowDeleted ? { _id: id } : { _id: id, deletedAt: null },
  );
  if (!category) {
    throw new AppError('Category not found', 404, { code: 'NOT_FOUND' });
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'parent')) {
    const nextParent = payload.parent || null;
    if (nextParent && String(nextParent) === String(category._id)) {
      throw new AppError('A category cannot be its own parent', 400, {
        code: 'INVALID_PARENT',
        details: [{ path: 'parent', message: 'A category cannot be its own parent' }],
      });
    }
    if (nextParent) {
      // Prevent cycles: walk ancestors of the proposed parent.
      let cursor = await Category.findById(nextParent).select('_id parent').lean();
      const seen = new Set([String(category._id)]);
      while (cursor) {
        const cursorId = String(cursor._id);
        if (seen.has(cursorId)) {
          throw new AppError('Invalid parent category (circular relationship)', 400, {
            code: 'INVALID_PARENT',
            details: [{ path: 'parent', message: 'Invalid parent category (circular relationship)' }],
          });
        }
        seen.add(cursorId);
        if (!cursor.parent) break;
        // eslint-disable-next-line no-await-in-loop
        cursor = await Category.findById(cursor.parent).select('_id parent').lean();
      }
    }
  }

  if (payload.slug != null || payload.name != null) {
    const requestedSlug = payload.slug != null ? toSlug(payload.slug) : null;
    if (requestedSlug && requestedSlug === category.slug) {
      // Unchanged slug — keep as-is (do not fail uniqueness against self).
      payload.slug = category.slug;
    } else {
      payload.slug = await ensureUniqueSlug(
        Category,
        payload.slug || payload.name || category.name,
        category._id,
      );
    }
  }

  Object.assign(category, payload, { updatedBy: userId });
  await category.save();
  return category.toObject();
}

export async function deleteCategory(id, userId) {
  const existing = await Category.findById(id);
  if (!existing) {
    throw new AppError('Category not found', 404, { code: 'NOT_FOUND' });
  }

  // Second delete on an already-trashed category permanently removes it.
  if (existing.deletedAt) {
    await Category.deleteOne({ _id: id });
    return existing.toObject();
  }

  existing.deletedAt = new Date();
  existing.status = 'inactive';
  existing.updatedBy = userId;
  await existing.save();
  return existing.toObject();
}

// ─── Brands ─────────────────────────────────────────────────────────────────

export async function listBrands(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { deletedAt: null };
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    Brand.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Brand.countDocuments(filter),
  ]);

  return { items, meta: buildPaginationMeta({ page, limit, total }) };
}

export async function getBrand(idOrSlug) {
  return getByIdOrSlug(Brand, idOrSlug, 'Brand not found');
}

export async function createBrand(payload, userId) {
  const slug = await ensureUniqueSlug(Brand, payload.slug || payload.name);
  const brand = await Brand.create({
    ...payload,
    slug,
    createdBy: userId,
    updatedBy: userId,
  });
  return brand.toObject();
}

export async function updateBrand(id, payload, userId) {
  const brand = await Brand.findOne({ _id: id, deletedAt: null });
  if (!brand) {
    throw new AppError('Brand not found', 404, { code: 'NOT_FOUND' });
  }

  if (payload.name || payload.slug) {
    payload.slug = await ensureUniqueSlug(
      Brand,
      payload.slug || payload.name || brand.name,
      brand._id,
    );
  }

  Object.assign(brand, payload, { updatedBy: userId });
  await brand.save();
  return brand.toObject();
}

export async function deleteBrand(id, userId) {
  const brand = await Brand.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date(), updatedBy: userId, status: 'inactive' } },
    { new: true },
  ).lean();

  if (!brand) {
    throw new AppError('Brand not found', 404, { code: 'NOT_FOUND' });
  }
  return brand;
}

// ─── Tags ───────────────────────────────────────────────────────────────────

export async function listTags(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.search) filter.name = new RegExp(query.search, 'i');

  const [items, total] = await Promise.all([
    Tag.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Tag.countDocuments(filter),
  ]);

  return { items, meta: buildPaginationMeta({ page, limit, total }) };
}

export async function getTag(idOrSlug) {
  const filter = isObjectId(idOrSlug)
    ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
    : { slug: idOrSlug };
  const tag = await Tag.findOne(filter).lean();
  if (!tag) {
    throw new AppError('Tag not found', 404, { code: 'NOT_FOUND' });
  }
  return tag;
}

export async function createTag(payload, userId) {
  const slug = await ensureUniqueSlug(Tag, payload.slug || payload.name);
  const tag = await Tag.create({
    ...payload,
    slug,
    createdBy: userId,
    updatedBy: userId,
  });
  return tag.toObject();
}

export async function updateTag(id, payload, userId) {
  const tag = await Tag.findById(id);
  if (!tag) {
    throw new AppError('Tag not found', 404, { code: 'NOT_FOUND' });
  }

  if (payload.name || payload.slug) {
    payload.slug = await ensureUniqueSlug(
      Tag,
      payload.slug || payload.name || tag.name,
      tag._id,
    );
  }

  Object.assign(tag, payload, { updatedBy: userId });
  await tag.save();
  return tag.toObject();
}

export async function deleteTag(id) {
  const tag = await Tag.findByIdAndDelete(id).lean();
  if (!tag) {
    throw new AppError('Tag not found', 404, { code: 'NOT_FOUND' });
  }
  return tag;
}

export default {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  listBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  listTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
};
