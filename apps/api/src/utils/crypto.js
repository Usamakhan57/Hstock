import crypto from 'node:crypto';

/**
 * Cryptomus sign = MD5(base64(json_body) + API_KEY)
 * JSON must use JSON_UNESCAPED_UNICODE behavior (no slash escaping differences handled separately).
 */
export function encodeCryptomusBody(payload) {
  return Buffer.from(
    JSON.stringify(payload),
    'utf8',
  ).toString('base64');
}

export function signCryptomusPayload(payload, apiKey) {
  if (!apiKey) {
    throw new Error('Cryptomus API key is required for signing');
  }
  const encoded = encodeCryptomusBody(payload);
  return crypto.createHash('md5').update(encoded + apiKey, 'utf8').digest('hex');
}

/**
 * Verify Cryptomus webhook/API signature.
 * Signature is embedded in the body as `sign` and must be stripped before hashing.
 */
export function verifyCryptomusSignature(payload, apiKey, providedSign) {
  if (!providedSign || !apiKey) return false;
  const clone = { ...payload };
  delete clone.sign;
  const expected = signCryptomusPayload(clone, apiKey);
  const a = Buffer.from(String(expected));
  const b = Buffer.from(String(providedSign));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

export function md5Hex(value) {
  return crypto.createHash('md5').update(String(value), 'utf8').digest('hex');
}

export function randomId(prefix = '', size = 12) {
  const token = crypto.randomBytes(Math.ceil(size / 2)).toString('hex').slice(0, size);
  return prefix ? `${prefix}_${token}` : token;
}

export default {
  encodeCryptomusBody,
  signCryptomusPayload,
  verifyCryptomusSignature,
  sha256Hex,
  md5Hex,
  randomId,
};
