import { z } from 'zod';
import { LEDGER_CURRENCY } from '../constants/currencies.js';

export const updateSystemConfigSchema = {
  body: z.object({
    sellerRegistrationFee: z.number().min(0).optional(),
    currency: z.string().min(3).max(10).optional().default(LEDGER_CURRENCY),
    isEnabled: z.boolean().optional(),
  }),
};

export const updatePlatformConfigSchema = {
  body: z.object({
    storeName: z.string().min(1).max(160).optional(),
    storeEmail: z.string().email().optional(),
    storeUrl: z.string().url().optional(),
    maintenanceMode: z.boolean().optional(),
    escrowAutoReleaseHours: z.number().positive().optional(),
    withdrawalAdminSlaHours: z.number().positive().optional(),
    minWithdrawalAmount: z.number().min(0).optional(),
    maxWithdrawalAmount: z.number().min(0).optional(),
    orderPaymentLifetimeSeconds: z.number().min(300).max(43200).optional(),
    supportEmail: z.string().email().optional(),
  }),
};

export const updateCommissionConfigSchema = {
  body: z.object({
    isActive: z.boolean().optional(),
    defaultPercent: z.number().min(0).max(100).optional(),
    categoryRules: z
      .array(
        z.object({
          id: z.string().min(1),
          categoryId: z.string().optional().nullable(),
          percent: z.number().min(0).max(100),
          priority: z.number().optional(),
        }),
      )
      .optional(),
    sellerRules: z
      .array(
        z.object({
          id: z.string().min(1),
          sellerId: z.string().optional().nullable(),
          percent: z.number().min(0).max(100),
          priority: z.number().optional(),
        }),
      )
      .optional(),
  }),
};

export default {
  updateSystemConfigSchema,
  updatePlatformConfigSchema,
  updateCommissionConfigSchema,
};
