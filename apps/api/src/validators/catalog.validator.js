import { z } from 'zod';
import { objectIdSchema, paginationSchema } from './common.validator.js';

const statusEnum = z.enum(['active', 'inactive']);

/** Accept absolute/relative/data URLs; coerce blank strings to null. */
const optionalImageRef = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.string().min(1).max(4000).nullable().optional(),
);

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
    slug: z.string().min(2).max(160).optional(),
    description: z.string().max(5000).optional(),
    image: optionalImageRef,
    icon: z.preprocess(
      (value) => (value === '' || value === undefined ? null : value),
      z.string().max(80).nullable().optional(),
    ),
    parent: z.preprocess(
      (value) => (value === '' || value === undefined ? null : value),
      objectIdSchema.nullable().optional(),
    ),
    displayOrder: z.number().int().optional(),
    status: statusEnum.optional(),
    featured: z.boolean().optional(),
    showInHeader: z.boolean().optional(),
    showOnHomepage: z.boolean().optional(),
    seoTitle: z.preprocess(
      (value) => (value === '' || value === undefined ? null : value),
      z.string().max(200).nullable().optional(),
    ),
    seoDescription: z.preprocess(
      (value) => (value === '' || value === undefined ? null : value),
      z.string().max(500).nullable().optional(),
    ),
    ogImage: optionalImageRef,
    deletedAt: z.preprocess(
      (value) => (value === '' || value === undefined ? null : value),
      z.union([z.string().datetime(), z.null()]).optional(),
    ),
  }),
};

export const categoryUpdateSchema = {
  params: z.object({ id: objectIdSchema }),
  body: categoryBodySchema.body.partial(),
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
