import { z } from 'zod';

export const cmsKeyParamsSchema = {
  params: z.object({
    key: z.string().trim().min(1).max(80),
  }),
};

export const updateCmsDocumentSchema = {
  params: z.object({
    key: z.string().trim().min(1).max(80),
  }),
  body: z.object({
    data: z.record(z.string(), z.any()).optional(),
  }).passthrough(),
};

export default {
  cmsKeyParamsSchema,
  updateCmsDocumentSchema,
};
