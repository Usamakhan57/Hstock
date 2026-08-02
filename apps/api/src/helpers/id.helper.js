import crypto from 'node:crypto';

function compactTimestamp() {
  const d = new Date();
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return (
    `${d.getUTCFullYear()}`
    + `${pad(d.getUTCMonth() + 1)}`
    + `${pad(d.getUTCDate())}`
    + `${pad(d.getUTCHours())}`
    + `${pad(d.getUTCMinutes())}`
    + `${pad(d.getUTCSeconds())}`
    + `${pad(d.getUTCMilliseconds(), 3)}`
  );
}

/** High-entropy commerce IDs — avoids same-second collisions under concurrent checkout. */
export function generateOrderNumber() {
  return `ORD-${compactTimestamp()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

export function generatePaymentOrderId(orderNumber) {
  // Cryptomus order_id: alpha_dash only, max 128
  const base = `pay_${String(orderNumber).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  if (base.length <= 120) {
    return `${base}_${crypto.randomBytes(4).toString('hex')}`;
  }
  return `pay_${compactTimestamp()}_${crypto.randomBytes(8).toString('hex')}`;
}

export function generateWithdrawalNumber() {
  return `WD-${compactTimestamp()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

export function generateDisputeNumber() {
  return `DSP-${compactTimestamp()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

export function generateRefundNumber() {
  return `RFD-${compactTimestamp()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

export function generateTransferId(prefix = 'xfer') {
  return `${prefix}_${compactTimestamp()}_${crypto.randomBytes(8).toString('hex')}`;
}

export function isDuplicateKeyError(error) {
  return Boolean(error && (error.code === 11000 || error?.codeName === 'DuplicateKey'));
}

export function duplicateKeyFields(error) {
  return Object.keys(error?.keyPattern || {});
}

export default {
  generateOrderNumber,
  generatePaymentOrderId,
  generateWithdrawalNumber,
  generateDisputeNumber,
  generateRefundNumber,
  generateTransferId,
  isDuplicateKeyError,
  duplicateKeyFields,
};
