/**
 * Paid store promotion — seller wallet fee for featured visibility.
 */

export const STORE_PROMOTION_STATUS = Object.freeze({
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
});

export const STORE_PROMOTION_STATUS_VALUES = Object.freeze(
  Object.values(STORE_PROMOTION_STATUS),
);

/** Defaults — overridable via PlatformConfig. */
export const STORE_PROMOTION_DEFAULTS = Object.freeze({
  enabled: true,
  priceUsd: 10,
  durationHours: 72,
});

export default {
  STORE_PROMOTION_STATUS,
  STORE_PROMOTION_STATUS_VALUES,
  STORE_PROMOTION_DEFAULTS,
};
