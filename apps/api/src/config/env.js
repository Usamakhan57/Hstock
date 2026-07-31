import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';
import { CRYPTOMUS_DEFAULT_BASE_URL } from '../constants/cryptomus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const API_ROOT = path.resolve(__dirname, '../..');

dotenv.config({ path: path.join(API_ROOT, '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.string().min(1).default('HStock API'),
  APP_URL: z.string().url().default('http://localhost:4000'),
  API_PREFIX: z.string().default('/api/v1'),

  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB_NAME: z.string().min(1).default('hstock'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  /** AES-256 key material for dispute credentials (hex/string). Falls back to derived JWT secret. */
  CREDENTIALS_ENCRYPTION_KEY: z
    .string()
    .optional()
    .default('')
    .refine((v) => !v || v.length >= 32, {
      message: 'CREDENTIALS_ENCRYPTION_KEY must be empty or at least 32 characters',
    }),
  DISPUTE_CREDENTIAL_TTL_DAYS: z.coerce.number().positive().default(30),

  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_DOMAIN: z.string().optional().default(''),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(200),

  UPLOAD_DIR: z.string().default('uploads'),
  UPLOAD_MAX_FILE_SIZE_MB: z.coerce.number().positive().default(10),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  LOG_DIR: z.string().default('logs'),

  ENABLE_JOBS: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  ESCROW_AUTO_RELEASE_HOURS: z.coerce.number().positive().default(24),
  WITHDRAWAL_ADMIN_SLA_HOURS: z.coerce.number().positive().default(24),

  CRYPTOMUS_MERCHANT_ID: z.string().optional().default(''),
  CRYPTOMUS_API_KEY: z.string().optional().default(''),
  CRYPTOMUS_WEBHOOK_SECRET: z.string().optional().default(''),
  CRYPTOMUS_BASE_URL: z.string().url().optional().default(CRYPTOMUS_DEFAULT_BASE_URL),
  CRYPTOMUS_MODE: z.enum(['sandbox', 'production']).default('sandbox'),
  CRYPTOMUS_URL_RETURN: z.string().optional().default(''),
  CRYPTOMUS_URL_SUCCESS: z.string().optional().default(''),
  CRYPTOMUS_ENFORCE_IP_WHITELIST: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  FRONTEND_URL: z.string().optional().default('http://localhost:3000'),

  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default('noreply@hstock.store'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:\n' + details);
  process.exit(1);
}

const data = parsed.data;

export const env = {
  ...data,
  apiRoot: API_ROOT,
  isProduction: data.NODE_ENV === 'production',
  isDevelopment: data.NODE_ENV === 'development',
  isTest: data.NODE_ENV === 'test',
  corsOrigins: data.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  uploadPath: path.isAbsolute(data.UPLOAD_DIR)
    ? data.UPLOAD_DIR
    : path.join(API_ROOT, data.UPLOAD_DIR),
  logPath: path.isAbsolute(data.LOG_DIR)
    ? data.LOG_DIR
    : path.join(API_ROOT, data.LOG_DIR),
  uploadMaxFileSizeBytes: Math.floor(data.UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024),
  cryptomusConfigured: Boolean(data.CRYPTOMUS_MERCHANT_ID && data.CRYPTOMUS_API_KEY),
};

export default env;
