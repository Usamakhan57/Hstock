/**
 * Permanent seller verification — one-time seller-wallet fee.
 */

export const SELLER_VERIFICATION_DEFAULTS = Object.freeze({
  enabled: true,
  feeUsd: 10,
  allowManual: true,
});

export const VERIFICATION_SOURCE = Object.freeze({
  WALLET: 'wallet',
  ADMIN: 'admin',
});

export const VERIFICATION_SOURCE_VALUES = Object.freeze(
  Object.values(VERIFICATION_SOURCE),
);

export default {
  SELLER_VERIFICATION_DEFAULTS,
  VERIFICATION_SOURCE,
  VERIFICATION_SOURCE_VALUES,
};
