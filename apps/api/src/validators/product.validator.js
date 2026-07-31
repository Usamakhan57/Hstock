import { z } from 'zod';
import { objectIdSchema, paginationSchema } from './common.validator.js';
import {
  PRODUCT_TYPE_VALUES,
  DELIVERY_TYPE_VALUES,
  LICENSE_TYPE_VALUES,
  STOCK_TYPE_VALUES,
  PRODUCT_VISIBILITY_VALUES,
  PRODUCT_STATUS_VALUES,
  APPROVAL_STATUS_VALUES,
  DOWNLOAD_TYPE_VALUES,
} from '../constants/productTypes.js';
import { ASSET_PLATFORM_VALUES } from '../constants/assetUniqueness.js';

const digitalSchema = z.object({
  downloadType: z.enum(DOWNLOAD_TYPE_VALUES).optional(),
  manual: z.boolean().optional(),
  automatic: z.boolean().optional(),
  licenseKey: z.string().max(500).nullable().optional(),
  downloadUrl: z.string().url().nullable().optional(),
  externalUrl: z.string().url().nullable().optional(),
  deliveryInstructions: z.string().max(10000).optional(),
  fileSize: z.number().min(0).nullable().optional(),
  fileType: z.string().max(80).nullable().optional(),
});

export const listProductsSchema = {
  query: paginationSchema.extend({
    status: z.enum(PRODUCT_STATUS_VALUES).optional(),
    approvalStatus: z.enum(APPROVAL_STATUS_VALUES).optional(),
    category: objectIdSchema.optional(),
    brand: objectIdSchema.optional(),
    collection: objectIdSchema.optional(),
    productType: z.enum(PRODUCT_TYPE_VALUES).optional(),
    seller: objectIdSchema.optional(),
    tag: objectIdSchema.optional(),
    featured: z.enum(['true', 'false']).optional(),
    mine: z.enum(['true', 'false']).optional(),
    search: z.string().max(200).optional(),
    assetIdentifier: z.string().min(1).max(500).optional(),
    assetIdentifierNormalized: z.string().min(1).max(500).optional(),
    assetPlatform: z.enum(ASSET_PLATFORM_VALUES).optional(),
  }),
};

export const productIdOrSlugSchema = {
  params: z.object({
    idOrSlug: z.string().min(1),
  }),
};

export const productIdSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
};

export const createProductSchema = {
  body: z.object({
    title: z.string().min(2).max(200),
    slug: z.string().min(2).max(220).optional(),
    description: z.string().max(50000).optional(),
    shortDescription: z.string().max(500).optional(),
    price: z.number().min(0),
    currency: z.string().min(3).max(10).optional(),
    seller: objectIdSchema.optional(),
    category: objectIdSchema.nullable().optional(),
    brand: objectIdSchema.nullable().optional(),
    collection: objectIdSchema.nullable().optional(),
    tags: z.array(objectIdSchema).optional(),
    thumbnail: z.string().url().nullable().optional(),
    gallery: z.array(z.string().url()).optional(),
    stock: z.number().int().min(0).optional(),
    status: z.enum(PRODUCT_STATUS_VALUES).optional(),
    visibility: z.enum(PRODUCT_VISIBILITY_VALUES).optional(),
    approvalStatus: z.enum(APPROVAL_STATUS_VALUES).optional(),
    featured: z.boolean().optional(),
    deliveryType: z.enum(DELIVERY_TYPE_VALUES).optional(),
    productType: z.enum(PRODUCT_TYPE_VALUES),
    assetIdentifier: z.string().min(1).max(500).nullable().optional(),
    assetPlatform: z.enum(ASSET_PLATFORM_VALUES).nullable().optional(),
    licenseType: z.enum(LICENSE_TYPE_VALUES).nullable().optional(),
    stockType: z.enum(STOCK_TYPE_VALUES).optional(),
    seoTitle: z.string().max(200).nullable().optional(),
    seoDescription: z.string().max(500).nullable().optional(),
    seoKeywords: z.array(z.string().max(80)).optional(),
    digital: digitalSchema.optional(),
  }),
};

export const updateProductSchema = {
  params: z.object({ id: objectIdSchema }),
  body: createProductSchema.body.partial(),
};

export const moderateProductSchema = {
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    approvalStatus: z.enum(APPROVAL_STATUS_VALUES).optional(),
    status: z.enum(PRODUCT_STATUS_VALUES).optional(),
    featured: z.boolean().optional(),
  }),
};

export default {
  listProductsSchema,
  productIdOrSlugSchema,
  productIdSchema,
  createProductSchema,
  updateProductSchema,
  moderateProductSchema,
};
