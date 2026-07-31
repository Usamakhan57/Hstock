import { PRODUCT_STATUS } from './productTypes.js';

/**
 * Listing statuses that reserve a digital asset globally.
 * Mapped onto existing Product.status values.
 *
 * Active / Published → live
 * Pending Review → pending
 * Draft (with identifier) → draft — reserves asset to prevent concurrent claims
 * Reserved / Escrow / Sold-not-completed → out_of_stock
 * Admin hold → disabled
 */
export const ASSET_BLOCKING_STATUSES = Object.freeze([
  PRODUCT_STATUS.DRAFT,
  PRODUCT_STATUS.PENDING,
  PRODUCT_STATUS.LIVE,
  PRODUCT_STATUS.OUT_OF_STOCK,
  PRODUCT_STATUS.DISABLED,
]);

/**
 * Statuses that release the asset for reuse by another listing.
 */
export const ASSET_REUSABLE_STATUSES = Object.freeze([
  PRODUCT_STATUS.REJECTED,
  PRODUCT_STATUS.ARCHIVED,
]);

export const ASSET_PLATFORMS = Object.freeze({
  EMAIL: 'email',
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  TIKTOK: 'tiktok',
  TWITTER: 'twitter',
  TELEGRAM: 'telegram',
  DISCORD: 'discord',
  YOUTUBE: 'youtube',
  DOMAIN: 'domain',
  WEBSITE: 'website',
  SAAS: 'saas',
  SOURCE_CODE: 'source_code',
  SCRIPT: 'script',
  APP: 'app',
  TEMPLATE: 'template',
  COURSE: 'course',
  EBOOK: 'ebook',
  LICENSE_KEY: 'license_key',
  DIGITAL_FILE: 'digital_file',
  GENERIC: 'generic',
});

export const ASSET_PLATFORM_VALUES = Object.freeze(Object.values(ASSET_PLATFORMS));

export const ASSET_CLAIM_STATUS = Object.freeze({
  CLAIMED: 'claimed',
  RELEASED: 'released',
});

export const ASSET_DUPLICATE_MESSAGE = 'This digital asset is already listed on HStock.';
export const ASSET_DUPLICATE_CODE = 'ASSET_ALREADY_LISTED';

export function isBlockingProductStatus(status, { deletedAt = null } = {}) {
  if (deletedAt) return false;
  return ASSET_BLOCKING_STATUSES.includes(status);
}

export default {
  ASSET_BLOCKING_STATUSES,
  ASSET_REUSABLE_STATUSES,
  ASSET_PLATFORMS,
  ASSET_PLATFORM_VALUES,
  ASSET_CLAIM_STATUS,
  ASSET_DUPLICATE_MESSAGE,
  ASSET_DUPLICATE_CODE,
  isBlockingProductStatus,
};
