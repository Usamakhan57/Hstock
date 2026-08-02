import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';
import { signCryptomusPayload, verifyCryptomusSignature, sha256Hex } from '../utils/crypto.js';
import { toMoneyString } from '../helpers/money.helper.js';
import {
  FALLBACK_CHECKOUT_ASSETS,
  mapPaymentServicesToAssets,
  normalizeCryptomusNetwork,
} from '../helpers/cryptomusAssets.helper.js';
import {
  CRYPTOMUS_ENDPOINTS,
  CRYPTOMUS_WEBHOOK_IPS,
  CRYPTOMUS_WEBHOOK_MAX_AGE_SECONDS,
  CRYPTOMUS_SUCCESS_STATUSES,
  CRYPTOMUS_PROCESSING_STATUSES,
  CRYPTOMUS_FAILURE_STATUSES,
  CRYPTOMUS_MODES,
} from '../constants/cryptomus.js';
import { PAYMENT_STATUS } from '../constants/statuses.js';

function getApiKey() {
  return env.CRYPTOMUS_API_KEY || env.CRYPTOMUS_WEBHOOK_SECRET || '';
}

function getMerchantId() {
  return env.CRYPTOMUS_MERCHANT_ID || '';
}

export function isCryptomusConfigured() {
  return Boolean(getMerchantId() && getApiKey());
}

export function getCryptomusMode() {
  return env.CRYPTOMUS_MODE || CRYPTOMUS_MODES.SANDBOX;
}

/**
 * Low-level Cryptomus HTTP client.
 */
export async function cryptomusRequest(endpoint, payload = {}) {
  if (!isCryptomusConfigured()) {
    throw new AppError('Cryptomus is not configured', 503, {
      code: 'CRYPTOMUS_NOT_CONFIGURED',
    });
  }

  const body = { ...payload };
  const sign = signCryptomusPayload(body, getApiKey());
  const url = `${env.CRYPTOMUS_BASE_URL.replace(/\/$/, '')}${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      merchant: getMerchantId(),
      sign,
    },
    body: JSON.stringify(body),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new AppError('Invalid Cryptomus response', 502, {
      code: 'CRYPTOMUS_INVALID_RESPONSE',
    });
  }

  if (!response.ok || data?.state !== 0) {
    logger.error('Cryptomus API error', {
      endpoint,
      status: response.status,
      body: data,
      mode: getCryptomusMode(),
    });
    throw new AppError(
      data?.message || data?.errors || 'Cryptomus request failed',
      502,
      {
        code: 'CRYPTOMUS_API_ERROR',
        details: data,
      },
    );
  }

  return data.result;
}

export async function createInvoice({
  amount,
  currency = 'USD',
  orderId,
  network = null,
  toCurrency = null,
  lifetime = 3600,
  urlCallback,
  urlReturn,
  urlSuccess,
  additionalData = null,
}) {
  const payload = {
    amount: toMoneyString(amount),
    currency,
    order_id: orderId,
    lifetime: Number(lifetime),
    is_payment_multiple: false,
    url_callback: urlCallback,
    url_return: urlReturn || env.CRYPTOMUS_URL_RETURN || `${env.FRONTEND_URL}/orders`,
    url_success: urlSuccess || env.CRYPTOMUS_URL_SUCCESS || `${env.FRONTEND_URL}/orders/success`,
  };

  const normalizedNetwork = normalizeCryptomusNetwork(network);
  if (normalizedNetwork) payload.network = normalizedNetwork;
  if (toCurrency) payload.to_currency = String(toCurrency).toUpperCase();
  if (additionalData) payload.additional_data = String(additionalData).slice(0, 255);

  // Sandbox mode still hits Cryptomus API with sandbox credentials when configured.
  // When not configured in test/dev, callers may use simulateInvoice().
  return cryptomusRequest(CRYPTOMUS_ENDPOINTS.CREATE_INVOICE, payload);
}

export async function getPaymentInfo({ uuid = null, orderId = null } = {}) {
  const payload = {};
  if (uuid) payload.uuid = uuid;
  if (orderId) payload.order_id = orderId;
  if (!payload.uuid && !payload.order_id) {
    throw new AppError('uuid or order_id is required', 400, { code: 'CRYPTOMUS_INFO_PARAMS' });
  }
  return cryptomusRequest(CRYPTOMUS_ENDPOINTS.PAYMENT_INFO, payload);
}

export async function listPaymentServices() {
  return cryptomusRequest(CRYPTOMUS_ENDPOINTS.PAYMENT_SERVICES, {});
}

/**
 * Buyer-facing currency/network catalog synchronized from Cryptomus.
 * Falls back to a broad offline list when the provider is unavailable.
 */
export async function listCheckoutAssets() {
  if (!isCryptomusConfigured()) {
    return {
      assets: FALLBACK_CHECKOUT_ASSETS.map((asset) => ({
        ...asset,
        networks: asset.networks.map((n) => ({ ...n })),
      })),
      source: 'fallback',
      mode: getCryptomusMode(),
    };
  }

  try {
    const services = await listPaymentServices();
    const assets = mapPaymentServicesToAssets(services);
    if (!assets.length) {
      logger.warn('Cryptomus payment services returned empty — using fallback checkout assets');
      return {
        assets: FALLBACK_CHECKOUT_ASSETS.map((asset) => ({
          ...asset,
          networks: asset.networks.map((n) => ({ ...n })),
        })),
        source: 'fallback',
        mode: getCryptomusMode(),
      };
    }
    return {
      assets,
      source: 'cryptomus',
      mode: getCryptomusMode(),
    };
  } catch (error) {
    logger.warn('Failed to load Cryptomus payment services — using fallback checkout assets', {
      message: error?.message,
    });
    return {
      assets: FALLBACK_CHECKOUT_ASSETS.map((asset) => ({
        ...asset,
        networks: asset.networks.map((n) => ({ ...n })),
      })),
      source: 'fallback',
      mode: getCryptomusMode(),
    };
  }
}

export async function resendWebhook({ uuid = null, orderId = null } = {}) {
  const payload = {};
  if (uuid) payload.uuid = uuid;
  if (orderId) payload.order_id = orderId;
  return cryptomusRequest(CRYPTOMUS_ENDPOINTS.RESEND_WEBHOOK, payload);
}

/**
 * Simulate invoice for local/test when Cryptomus credentials are absent.
 */
export function simulateInvoice({ amount, currency, orderId, lifetime = 3600 }) {
  const uuid = `sim_${sha256Hex(orderId).slice(0, 24)}`;
  return {
    uuid,
    order_id: orderId,
    amount: toMoneyString(amount),
    currency,
    url: `${env.APP_URL}/api/v1/payments/cryptomus/sandbox/${uuid}`,
    payment_status: 'check',
    is_final: false,
    expired_at: Math.floor(Date.now() / 1000) + Number(lifetime),
    created_at: new Date().toISOString(),
    network: null,
    address: null,
    simulated: true,
    mode: getCryptomusMode(),
  };
}

export async function createInvoiceOrSimulate(params) {
  if (!isCryptomusConfigured()) {
    if (env.isProduction) {
      throw new AppError('Cryptomus is not configured', 503, {
        code: 'CRYPTOMUS_NOT_CONFIGURED',
      });
    }
    logger.warn('Cryptomus credentials missing — using simulated invoice (non-production)');
    return {
      invoice: simulateInvoice(params),
      simulated: true,
    };
  }
  const invoice = await createInvoice(params);
  return { invoice, simulated: false };
}

export function mapCryptomusStatusToPaymentStatus(providerStatus) {
  const status = String(providerStatus || '').toLowerCase();
  if (CRYPTOMUS_SUCCESS_STATUSES.includes(status)) return PAYMENT_STATUS.PAID;
  if (CRYPTOMUS_PROCESSING_STATUSES.includes(status)) return PAYMENT_STATUS.PROCESSING;
  if (status === 'wrong_amount' || status === 'wrong_amount_waiting') return PAYMENT_STATUS.PARTIAL;
  if (status === 'cancel') return PAYMENT_STATUS.CANCELLED;
  if (CRYPTOMUS_FAILURE_STATUSES.includes(status)) return PAYMENT_STATUS.FAILED;
  if (status === 'refund_paid') return PAYMENT_STATUS.REFUNDED;
  if (status === 'refund_process' || status === 'refund_fail') return PAYMENT_STATUS.PROCESSING;
  return PAYMENT_STATUS.PENDING;
}

export function verifyWebhookSignature(payload) {
  const sign = payload?.sign;
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new AppError('Cryptomus API key missing for webhook verification', 503, {
      code: 'CRYPTOMUS_NOT_CONFIGURED',
    });
  }
  const valid = verifyCryptomusSignature(payload, apiKey, sign);
  if (!valid) {
    throw new AppError('Invalid Cryptomus webhook signature', 401, {
      code: 'CRYPTOMUS_INVALID_SIGNATURE',
    });
  }
  return true;
}

export function assertWebhookIpAllowed(ip) {
  if (!env.CRYPTOMUS_ENFORCE_IP_WHITELIST) return true;
  const normalized = String(ip || '').replace('::ffff:', '');
  if (!CRYPTOMUS_WEBHOOK_IPS.includes(normalized)) {
    throw new AppError('Cryptomus webhook IP not allowed', 403, {
      code: 'CRYPTOMUS_IP_DENIED',
      details: { ip: normalized },
    });
  }
  return true;
}

/**
 * Replay protection: reject stale webhook payloads when a timestamp is present.
 */
export function assertWebhookNotExpired(payload) {
  const candidates = [
    payload?.updated_at,
    payload?.status_date,
    payload?.created_at,
  ].filter(Boolean);

  if (!candidates.length) return true;

  for (const value of candidates) {
    let ts;
    if (typeof value === 'number') {
      ts = value > 1e12 ? value : value * 1000;
    } else {
      const parsed = Date.parse(String(value));
      if (Number.isNaN(parsed)) continue;
      ts = parsed;
    }
    const ageSeconds = Math.abs(Date.now() - ts) / 1000;
    if (ageSeconds > CRYPTOMUS_WEBHOOK_MAX_AGE_SECONDS) {
      throw new AppError('Cryptomus webhook payload expired', 400, {
        code: 'CRYPTOMUS_WEBHOOK_EXPIRED',
      });
    }
  }
  return true;
}

export function buildWebhookEventKey(payload) {
  const uuid = payload?.uuid || 'none';
  const orderId = payload?.order_id || 'none';
  const status = payload?.status || payload?.payment_status || 'none';
  const txid = payload?.txid || 'none';
  const sign = payload?.sign || '';
  return sha256Hex(`${uuid}|${orderId}|${status}|${txid}|${sign}`);
}

export function buildCallbackUrl() {
  return `${env.APP_URL}${env.API_PREFIX}/payments/cryptomus/webhook`;
}

export default {
  isCryptomusConfigured,
  getCryptomusMode,
  cryptomusRequest,
  createInvoice,
  getPaymentInfo,
  listPaymentServices,
  listCheckoutAssets,
  resendWebhook,
  simulateInvoice,
  createInvoiceOrSimulate,
  mapCryptomusStatusToPaymentStatus,
  verifyWebhookSignature,
  assertWebhookIpAllowed,
  assertWebhookNotExpired,
  buildWebhookEventKey,
  buildCallbackUrl,
};
