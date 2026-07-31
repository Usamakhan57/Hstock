import { DEFAULT_LICENSES } from './LicensingEditor';

// Mock-only commission rate shown as a live preview in the Pricing tab.
// Swaps for a real per-seller/category rate once commission rules exist
// on the backend — the UI just reads whatever rate is passed in.
export const DEFAULT_COMMISSION_RATE = 0.15;

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR'];
export const TAX_CLASSES = ['Standard', 'Reduced', 'Zero-rated', 'Digital Goods'];

export const EMPTY_EXTENDED_PRODUCT = {
  // Section 1 — Basic Information
  shortDescription: '',
  subCategoryId: '',
  trending: false,
  bestSeller: false,
  newArrival: false,

  // Section 2 — Pricing
  discountPercent: '',
  taxClass: 'Digital Goods',
  currency: 'USD',

  // Section 3 — Digital Files
  additionalFiles: [],
  liveDemoUrl: '',
  documentationPdf: null,
  version: '1.0.0',
  changelog: '',
  fileSize: '',
  supportedSoftware: [],
  compatibleVersions: [],

  // Section 4 — Licensing
  licenses: DEFAULT_LICENSES,

  // Inventory
  unlimitedStock: true,
  barcode: '',

  // SEO
  seoTitle: '',
  keywords: [],
  ogImage: '',
  canonicalUrl: '',

  // Product Options
  variations: { allowVariations: false, attributes: [] },
};
