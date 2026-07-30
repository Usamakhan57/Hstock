import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export default {
  objectIdSchema,
  paginationSchema,
};
