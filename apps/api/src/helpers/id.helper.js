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
  );
}

export function generateOrderNumber() {
  return `ORD-${compactTimestamp()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export function generatePaymentOrderId(orderNumber) {
  // Cryptomus order_id: alpha_dash only, max 128
  return `pay_${String(orderNumber).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

export function generateWithdrawalNumber() {
  return `WD-${compactTimestamp()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export function generateDisputeNumber() {
  return `DSP-${compactTimestamp()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export function generateRefundNumber() {
  return `RFD-${compactTimestamp()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export function generateTransferId(prefix = 'xfer') {
  return `${prefix}_${compactTimestamp()}_${crypto.randomBytes(6).toString('hex')}`;
}

export default {
  generateOrderNumber,
  generatePaymentOrderId,
  generateWithdrawalNumber,
  generateDisputeNumber,
  generateRefundNumber,
  generateTransferId,
};
