import { z } from 'zod';
import { objectIdSchema, paginationSchema } from './common.validator.js';
import { USER_ROLE_VALUES } from '../constants/roles.js';
import { UserStatusEnum, VerificationStatusEnum, SellerStatusEnum } from '../constants/enums.js';
import { SUPPORTED_COINS, CRYPTOMUS_NETWORKS } from '../constants/coins.js';

export const updateMeSchema = {
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    phone: z.string().max(40).nullable().optional(),
    country: z.string().max(80).nullable().optional(),
    timezone: z.string().max(80).optional(),
    avatar: z.string().url().nullable().optional(),
  }),
};

export const updateBuyerProfileSchema = {
  body: z.object({
    username: z.string().min(3).max(40).optional(),
    bio: z.string().max(2000).optional(),
    avatar: z.string().url().nullable().optional(),
    coverUrl: z.string().url().nullable().optional(),
    phone: z.string().max(40).nullable().optional(),
    country: z.string().max(80).nullable().optional(),
    address: z.string().max(300).nullable().optional(),
    city: z.string().max(120).nullable().optional(),
    postalCode: z.string().max(40).nullable().optional(),
    preferences: z
      .object({
        marketing: z.boolean().optional(),
        orderUpdates: z.boolean().optional(),
        newArrivals: z.boolean().optional(),
        telegramNotifications: z.boolean().optional(),
      })
      .optional(),
  }),
};

export const updateSellerProfileSchema = {
  body: z.object({
    storeName: z.string().min(2).max(160).optional(),
    ownerName: z.string().max(120).optional(),
    phone: z.string().max(40).nullable().optional(),
    country: z.string().max(80).nullable().optional(),
    timezone: z.string().max(80).optional(),
    avatar: z.string().url().nullable().optional(),
    logo: z.string().url().nullable().optional(),
    banner: z.string().url().nullable().optional(),
    bio: z.string().max(5000).optional(),
    specialty: z.string().max(160).nullable().optional(),
    address: z.string().max(300).nullable().optional(),
    withdrawalWallets: z
      .array(
        z.object({
          coin: z.enum(SUPPORTED_COINS),
          network: z.enum(CRYPTOMUS_NETWORKS),
          walletAddress: z.string().min(6).max(256),
          label: z.string().max(80).optional(),
          isDefault: z.boolean().optional(),
        }),
      )
      .optional(),
    payout: z
      .object({
        asset: z.string().nullable().optional(),
        network: z.string().nullable().optional(),
        walletAddress: z.string().nullable().optional(),
      })
      .optional(),
    shippingPolicy: z.string().max(5000).nullable().optional(),
    defaultProcessingTime: z.string().max(120).nullable().optional(),
    notifications: z
      .object({
        newOrders: z.boolean().optional(),
        newReviews: z.boolean().optional(),
        payouts: z.boolean().optional(),
        marketing: z.boolean().optional(),
      })
      .optional(),
  }),
};

export const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
  }),
};

export const listUsersSchema = {
  query: paginationSchema.extend({
    role: z.enum(USER_ROLE_VALUES).optional(),
    status: z.enum(Object.values(UserStatusEnum)).optional(),
    search: z.string().max(120).optional(),
  }),
};

export const adminUpdateUserSchema = {
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    status: z.enum(Object.values(UserStatusEnum)).optional(),
    verificationStatus: z.enum(Object.values(VerificationStatusEnum)).optional(),
    roles: z.array(z.enum(USER_ROLE_VALUES)).min(1).optional(),
    emailVerified: z.boolean().optional(),
  }),
};

export const adminUpdateSellerSchema = {
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    status: z.enum(Object.values(SellerStatusEnum)).optional(),
    verified: z.boolean().optional(),
    verificationStatus: z.enum(Object.values(VerificationStatusEnum)).optional(),
  }),
};

export default {
  updateMeSchema,
  updateBuyerProfileSchema,
  updateSellerProfileSchema,
  changePasswordSchema,
  listUsersSchema,
  adminUpdateUserSchema,
  adminUpdateSellerSchema,
};
