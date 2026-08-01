import { z } from 'zod';
import { objectIdSchema, paginationSchema } from './common.validator.js';
import { TELEGRAM_BROADCAST_CATEGORIES } from '../models/TelegramBroadcast.model.js';

export const telegramSettingsSchema = {
  body: z.object({
    notificationsEnabled: z.boolean(),
  }),
};

export const telegramBroadcastSchema = {
  body: z.object({
    title: z.string().min(2).max(200),
    message: z.string().min(2).max(3500),
    category: z.enum(TELEGRAM_BROADCAST_CATEGORIES).optional(),
    audience: z.enum(['all', 'buyers', 'sellers', 'connected']).optional(),
  }),
};

export const telegramLogsQuerySchema = {
  query: paginationSchema.extend({
    status: z.enum(['queued', 'sent', 'failed', 'skipped']).optional(),
    kind: z.enum(['notification', 'broadcast', 'system', 'connect']).optional(),
    eventType: z.string().max(80).optional(),
    userId: objectIdSchema.optional(),
  }),
};

export const telegramBroadcastsQuerySchema = {
  query: paginationSchema.extend({
    category: z.enum(TELEGRAM_BROADCAST_CATEGORIES).optional(),
    status: z.enum(['draft', 'queued', 'sending', 'completed', 'failed', 'cancelled']).optional(),
  }),
};

export const telegramUsersQuerySchema = {
  query: paginationSchema.extend({
    search: z.string().max(120).optional(),
  }),
};

export default {
  telegramSettingsSchema,
  telegramBroadcastSchema,
  telegramLogsQuerySchema,
  telegramBroadcastsQuerySchema,
  telegramUsersQuerySchema,
};
