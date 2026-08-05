import { z } from 'zod';
import { objectIdSchema, paginationSchema } from './common.validator.js';

const statusEnum = z.enum(['active', 'inactive']);

function blankToNull(value) {
  if (value === '' || value === undefined || value === null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  return value;
}

function blankToUndefined(value) {
  if (value === '' || value === undefined || value === null) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
}

/**
 * Category image / OG image: URL or site path only — never embedded data URIs.
 * Blank / whitespace strings become null so edit forms can omit images.
 */
const optionalCategoryImageRef = z.preprocess(
  blankToNull,
  z.union([
    z.string()
      .min(1)
      .max(4000)
      .refine((value) => !String(value).trim().toLowerCase().startsWith('data:'), {
        message: 'Image must be a URL, not an embedded data URI',
      })
      .refine((value) => /^(https?:\/\/|\/)/i.test(String(value).trim()), {
        message: 'Image must be an http(s) URL or a site path starting with /',
      }),
    z.null(),
  ]).optional(),
);

const optionalIconRef = z.preprocess(
  blankToNull,
  z.union([z.string().max(80), z.null()]).optional(),
);

/** Parent category id — blank / root sentinels / populated objects → null or id string. */
const optionalParentRef = z.preprocess((value) => {
  if (value === '' || value === undefined || value === null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const lower = trimmed.toLowerCase();
    if (lower === '__root__' || lower === 'null' || lower === 'undefined' || lower === 'none') {
      return null;
    }
    return trimmed;
  }
  if (typeof value === 'object') {
    const id = value._id || value.id;
    return id ? String(id) : null;
  }
  return value;
}, objectIdSchema.nullable().optional());

const optionalSeoString = (max) => z.preprocess(
  blankToNull,
  z.union([z.string().max(max), z.null()]).optional(),
);

const optionalDescription = z.preprocess(
  (value) => (value === null || value === undefined ? '' : value),
  z.string().max(5000).optional(),
);

const optionalSlug = z.preprocess(
  blankToUndefined,
  z.string().min(2).max(160).optional(),
);

const optionalDisplayOrder = z.preprocess(
  blankToUndefined,
  z.coerce.number().int().optional(),
);

const optionalBoolean = z.preprocess((value) => {
  if (value === '' || value === undefined) return undefined;
  if (value === null) return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return value;
}, z.boolean().optional());

export const listQuerySchema = {
  query: paginationSchema.extend({
    status: statusEnum.optional(),
    featured: z.enum(['true', 'false']).optional(),
    showOnHomepage: z.enum(['true', 'false']).optional(),
    includeDeleted: z.enum(['true', 'false']).optional(),
    parent: z.string().optional(),
    search: z.string().max(120).optional(),
  }),
};

export const idParamSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
};

export const idOrSlugParamSchema = {
  params: z.object({
    idOrSlug: z.string().min(1),
  }),
};

export const categoryBodySchema = {
  body: z.object({
    name: z.string().min(2).max(160),
    slug: optionalSlug,
    description: optionalDescription,
    image: optionalCategoryImageRef,
    icon: optionalIconRef,
    parent: optionalParentRef,
    displayOrder: optionalDisplayOrder,
    status: statusEnum.optional(),
    featured: optionalBoolean,
    showInHeader: optionalBoolean,
    showOnHomepage: optionalBoolean,
    seoTitle: optionalSeoString(200),
    seoDescription: optionalSeoString(500),
    ogImage: optionalCategoryImageRef,
    deletedAt: z.preprocess(
      blankToNull,
      z.union([z.string().datetime(), z.null()]).optional(),
    ),
  }),
};

export const categoryUpdateSchema = {
  params: z.object({ id: objectIdSchema }),
  body: categoryBodySchema.body.partial().extend({
    // Name stays optional on PATCH but still enforces min length when provided.
    name: z.string().min(2).max(160).optional(),
  }),
};

export const brandBodySchema = {
  body: z.object({
    name: z.string().min(2).max(160),
    slug: z.string().min(2).max(160).optional(),
    logo: z.string().url().nullable().optional(),
    website: z.string().url().nullable().optional(),
    description: z.string().max(5000).optional(),
    status: statusEnum.optional(),
  }),
};

export const brandUpdateSchema = {
  params: z.object({ id: objectIdSchema }),
  body: brandBodySchema.body.partial(),
};

export const tagBodySchema = {
  body: z.object({
    name: z.string().min(1).max(80),
    slug: z.string().min(1).max(80).optional(),
    description: z.string().max(1000).optional(),
    status: statusEnum.optional(),
  }),
};

export const tagUpdateSchema = {
  params: z.object({ id: objectIdSchema }),
  body: tagBodySchema.body.partial(),
};

export default {
  listQuerySchema,
  idParamSchema,
  idOrSlugParamSchema,
  categoryBodySchema,
  categoryUpdateSchema,
  brandBodySchema,
  brandUpdateSchema,
  tagBodySchema,
  tagUpdateSchema,
};
