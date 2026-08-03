import { z } from 'zod';
import { objectIdSchema } from './common.validator.js';
import { INVENTORY_SOURCE_FORMAT_VALUES } from '../models/ProductInventoryItem.model.js';

const inventoryAccountSchema = z.object({
  fields: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  email: z.string().optional(),
  password: z.string().optional(),
  recovery: z.string().optional(),
  '2fa': z.string().optional(),
  cookie: z.string().optional(),
  token: z.string().optional(),
}).passthrough();

export const replaceInventorySchema = {
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    accounts: z.array(inventoryAccountSchema).min(1).max(5000),
    sourceFormat: z.enum(INVENTORY_SOURCE_FORMAT_VALUES).optional().default('paste'),
    mode: z.enum(['replace_available', 'append']).optional().default('replace_available'),
  }),
};

export const listInventorySchema = {
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({
    includeSold: z.enum(['true', 'false']).optional(),
  }).optional().default({}),
};

export default {
  replaceInventorySchema,
  listInventorySchema,
};
