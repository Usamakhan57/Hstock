import crypto from 'node:crypto';
import { env } from '../config/env.js';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const VERSION = 'v1';

const SENSITIVE_FIELD_KEYS = Object.freeze([
  'username',
  'email',
  'password',
  'otp',
  'recoveryCode',
  'backupCode',
  'twoFactorRecoveryCode',
  'secretKey',
  'licenseKey',
  'apiKey',
  'recoveryEmail',
  'recoveryPhone',
]);

function getKey() {
  if (env.isProduction && (!env.CREDENTIALS_ENCRYPTION_KEY || env.CREDENTIALS_ENCRYPTION_KEY.length < 32)) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY is required in production');
  }
  const raw = env.CREDENTIALS_ENCRYPTION_KEY
    || crypto.createHash('sha256').update(env.JWT_ACCESS_SECRET).digest('hex');
  return crypto.createHash('sha256').update(String(raw)).digest();
}

/**
 * Encrypt a plaintext string. Returns opaque payload safe for MongoDB storage.
 * Never log the return value's decrypted form.
 */
export function encryptCredential(plaintext) {
  if (plaintext === undefined || plaintext === null || plaintext === '') {
    return null;
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

export function decryptCredential(payload) {
  if (!payload) return null;
  const parts = String(payload).split('.');
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error('Invalid credential payload');
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, 'base64url');
  const tag = Buffer.from(tagB64, 'base64url');
  const data = Buffer.from(dataB64, 'base64url');
  if (tag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid credential auth tag');
  }
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

export function maskCredential(value, { visible = 2 } = {}) {
  if (value === undefined || value === null || value === '') return null;
  const str = String(value);
  if (str.length <= visible) return '*'.repeat(Math.max(4, str.length));
  return `${str.slice(0, visible)}${'*'.repeat(Math.min(12, str.length - visible))}`;
}

export function encryptSensitiveObject(fields = {}) {
  const encrypted = {};
  const masked = {};
  for (const key of SENSITIVE_FIELD_KEYS) {
    if (fields[key] === undefined || fields[key] === null || fields[key] === '') continue;
    encrypted[key] = encryptCredential(fields[key]);
    masked[key] = maskCredential(fields[key]);
  }
  return { encrypted, masked };
}

export function decryptSensitiveObject(encrypted = {}) {
  const out = {};
  for (const key of SENSITIVE_FIELD_KEYS) {
    if (!encrypted[key]) continue;
    out[key] = decryptCredential(encrypted[key]);
  }
  return out;
}

/** Redact sensitive keys from arbitrary objects before logging. */
export function redactForLogs(value, depth = 0) {
  if (depth > 6 || value == null) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => redactForLogs(v, depth + 1));
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_FIELD_KEYS.includes(key) || /password|secret|apiKey|otp|recovery/i.test(key)) {
      out[key] = '[REDACTED]';
    } else {
      out[key] = redactForLogs(val, depth + 1);
    }
  }
  return out;
}

export const CREDENTIAL_FIELD_KEYS = SENSITIVE_FIELD_KEYS;

export default {
  encryptCredential,
  decryptCredential,
  maskCredential,
  encryptSensitiveObject,
  decryptSensitiveObject,
  redactForLogs,
  CREDENTIAL_FIELD_KEYS,
};
