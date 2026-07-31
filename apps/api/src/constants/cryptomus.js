/**
 * Cryptomus gateway constants.
 */

export const CRYPTOMUS_PAYMENT_STATUSES = Object.freeze({
  PAID: 'paid',
  PAID_OVER: 'paid_over',
  WRONG_AMOUNT: 'wrong_amount',
  PROCESS: 'process',
  CONFIRM_CHECK: 'confirm_check',
  WRONG_AMOUNT_WAITING: 'wrong_amount_waiting',
  CHECK: 'check',
  FAIL: 'fail',
  CANCEL: 'cancel',
  SYSTEM_FAIL: 'system_fail',
  REFUND_PROCESS: 'refund_process',
  REFUND_FAIL: 'refund_fail',
  REFUND_PAID: 'refund_paid',
  LOCKED: 'locked',
});

/** Statuses that mean funds were successfully received */
export const CRYPTOMUS_SUCCESS_STATUSES = Object.freeze([
  CRYPTOMUS_PAYMENT_STATUSES.PAID,
  CRYPTOMUS_PAYMENT_STATUSES.PAID_OVER,
]);

/** Statuses that mean payment is still in flight */
export const CRYPTOMUS_PROCESSING_STATUSES = Object.freeze([
  CRYPTOMUS_PAYMENT_STATUSES.PROCESS,
  CRYPTOMUS_PAYMENT_STATUSES.CONFIRM_CHECK,
  CRYPTOMUS_PAYMENT_STATUSES.CHECK,
  CRYPTOMUS_PAYMENT_STATUSES.WRONG_AMOUNT_WAITING,
  CRYPTOMUS_PAYMENT_STATUSES.LOCKED,
]);

/** Statuses that mean payment failed / cancelled / expired */
export const CRYPTOMUS_FAILURE_STATUSES = Object.freeze([
  CRYPTOMUS_PAYMENT_STATUSES.FAIL,
  CRYPTOMUS_PAYMENT_STATUSES.CANCEL,
  CRYPTOMUS_PAYMENT_STATUSES.SYSTEM_FAIL,
  CRYPTOMUS_PAYMENT_STATUSES.WRONG_AMOUNT,
]);

export const CRYPTOMUS_DEFAULT_BASE_URL = 'https://api.cryptomus.com/v1';

export const CRYPTOMUS_ENDPOINTS = Object.freeze({
  CREATE_INVOICE: '/payment',
  PAYMENT_INFO: '/payment/info',
  PAYMENT_SERVICES: '/payment/services',
  RESEND_WEBHOOK: '/payment/resend',
  TEST_WEBHOOK: '/test-webhook/payment',
});

/** Official Cryptomus webhook source IPs */
export const CRYPTOMUS_WEBHOOK_IPS = Object.freeze([
  '91.227.144.7',
  '91.227.144.54',
]);

/** Max age for webhook acceptance (replay protection), seconds */
export const CRYPTOMUS_WEBHOOK_MAX_AGE_SECONDS = 60 * 60 * 24; // 24h

export const CRYPTOMUS_MODES = Object.freeze({
  SANDBOX: 'sandbox',
  PRODUCTION: 'production',
});

export default {
  CRYPTOMUS_PAYMENT_STATUSES,
  CRYPTOMUS_SUCCESS_STATUSES,
  CRYPTOMUS_PROCESSING_STATUSES,
  CRYPTOMUS_FAILURE_STATUSES,
  CRYPTOMUS_DEFAULT_BASE_URL,
  CRYPTOMUS_ENDPOINTS,
  CRYPTOMUS_WEBHOOK_IPS,
  CRYPTOMUS_WEBHOOK_MAX_AGE_SECONDS,
  CRYPTOMUS_MODES,
};
