import { z } from 'zod';
import { SUPPORTED_COINS, CRYPTOMUS_NETWORKS } from '../constants/coins.js';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long');

const emailSchema = z.string().email().max(254).transform((v) => v.toLowerCase());

const withdrawalWalletSchema = z.object({
  coin: z.enum(SUPPORTED_COINS),
  network: z.enum(CRYPTOMUS_NETWORKS),
  walletAddress: z.string().min(6).max(256),
  label: z.string().max(80).optional(),
  isDefault: z.boolean().optional(),
});

export const registerBuyerSchema = {
  body: z.object({
    name: z.string().min(2).max(120),
    email: emailSchema,
    password: passwordSchema,
    phone: z.string().max(40).optional(),
    country: z.string().max(80).optional(),
    timezone: z.string().max(80).optional(),
    username: z.string().min(3).max(40).optional(),
    avatar: z.string().url().optional(),
  }),
};

export const loginSchema = {
  body: z.object({
    email: emailSchema,
    password: z.string().min(1),
  }),
};

export const registerSellerSchema = {
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    username: z.string().min(3).max(30).optional(),
    email: emailSchema,
    password: passwordSchema,
    storeName: z.string().min(2).max(160),
    storeSlug: z.string().min(2).max(160).optional(),
    phone: z.string().max(40).optional(),
    country: z.string().max(80).optional(),
    timezone: z.string().max(80).optional(),
    bio: z.string().max(5000).optional(),
    specialty: z.string().max(160).optional(),
    ownerName: z.string().max(120).optional(),
    withdrawalWallets: z.array(withdrawalWalletSchema).optional(),
  }).refine((body) => Boolean(body.username || body.name), {
    message: 'Username is required',
    path: ['username'],
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: emailSchema,
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(20),
    password: passwordSchema,
  }),
};

export const verifyEmailSchema = {
  body: z.object({
    token: z.string().min(20),
  }).optional(),
  query: z.object({
    token: z.string().min(20).optional(),
  }).optional(),
};

export default {
  registerBuyerSchema,
  loginSchema,
  registerSellerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
};
