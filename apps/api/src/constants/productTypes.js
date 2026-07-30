export const PRODUCT_TYPES = Object.freeze({
  SOCIAL_ACCOUNTS: 'social_accounts',
  DOMAINS: 'domains',
  WEBSITES: 'websites',
  APPS: 'apps',
  SOURCE_CODE: 'source_code',
  AI_TOOLS: 'ai_tools',
  TEMPLATES: 'templates',
  COURSES: 'courses',
  EBOOKS: 'ebooks',
  SCRIPTS: 'scripts',
  LICENSE_KEYS: 'license_keys',
  DIGITAL_FILES: 'digital_files',
});

export const PRODUCT_TYPE_VALUES = Object.freeze(Object.values(PRODUCT_TYPES));

export const DELIVERY_TYPES = Object.freeze({
  AUTOMATIC: 'automatic',
  MANUAL: 'manual',
});

export const DELIVERY_TYPE_VALUES = Object.freeze(Object.values(DELIVERY_TYPES));

export const LICENSE_TYPES = Object.freeze({
  PERSONAL: 'personal',
  COMMERCIAL: 'commercial',
  EXTENDED: 'extended',
  OEM: 'oem',
  OTHER: 'other',
});

export const LICENSE_TYPE_VALUES = Object.freeze(Object.values(LICENSE_TYPES));

export const STOCK_TYPES = Object.freeze({
  LIMITED: 'limited',
  UNLIMITED: 'unlimited',
});

export const STOCK_TYPE_VALUES = Object.freeze(Object.values(STOCK_TYPES));

export const PRODUCT_VISIBILITY = Object.freeze({
  PUBLIC: 'public',
  PRIVATE: 'private',
  UNLISTED: 'unlisted',
});

export const PRODUCT_VISIBILITY_VALUES = Object.freeze(Object.values(PRODUCT_VISIBILITY));

export const PRODUCT_STATUS = Object.freeze({
  DRAFT: 'draft',
  PENDING: 'pending',
  LIVE: 'live',
  REJECTED: 'rejected',
  DISABLED: 'disabled',
  ARCHIVED: 'archived',
  OUT_OF_STOCK: 'out_of_stock',
});

export const PRODUCT_STATUS_VALUES = Object.freeze(Object.values(PRODUCT_STATUS));

export const APPROVAL_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

export const APPROVAL_STATUS_VALUES = Object.freeze(Object.values(APPROVAL_STATUS));

export const DOWNLOAD_TYPES = Object.freeze({
  MANUAL: 'manual',
  AUTOMATIC: 'automatic',
});

export const DOWNLOAD_TYPE_VALUES = Object.freeze(Object.values(DOWNLOAD_TYPES));

export default {
  PRODUCT_TYPES,
  PRODUCT_TYPE_VALUES,
  DELIVERY_TYPES,
  DELIVERY_TYPE_VALUES,
  LICENSE_TYPES,
  LICENSE_TYPE_VALUES,
  STOCK_TYPES,
  STOCK_TYPE_VALUES,
  PRODUCT_VISIBILITY,
  PRODUCT_VISIBILITY_VALUES,
  PRODUCT_STATUS,
  PRODUCT_STATUS_VALUES,
  APPROVAL_STATUS,
  APPROVAL_STATUS_VALUES,
  DOWNLOAD_TYPES,
  DOWNLOAD_TYPE_VALUES,
};
