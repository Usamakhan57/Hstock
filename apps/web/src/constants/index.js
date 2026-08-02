/**
 * Central constants — shared by filters, search, SEO, and the API service
 * layer. When the Node/Express backend goes live, only API_BASE_URL and
 * ENDPOINTS need to change.
 */

export const SITE = {
  name: 'ApnaStore',
  tagline: 'Secure Digital Marketplace for Accounts, Assets & Tools',
  url: 'https://apnastore.org',
  description:
    'ApnaStore is a secure marketplace to buy and sell social accounts, domains, websites, SaaS, source code, apps, AI tools, templates, courses, and digital assets — with escrow protection and verified sellers.',
  twitter: '@apnastore',
};

/** Backend API base (`/api/v1`). Override with VITE_API_URL. */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const ENDPOINTS = {
  products: '/products',
  product: (id) => `/products/${id}`,
  categories: '/categories',
  categoryProducts: (slug) => `/categories/${slug}/products`,
  sellers: '/sellers',
  seller: (slug) => `/seller/${slug}`,
  // Legacy aliases
  artists: '/sellers',
  artist: (slug) => `/seller/${slug}`,
  blog: '/blog',
  blogPost: (slug) => `/blog/${slug}`,
  search: '/search',
  auth: { login: '/auth/login', register: '/auth/register' },
  wallet: '/wallet',
  orders: '/orders',
  newsletter: '/newsletter/subscribe',
};

export const SORT_OPTIONS = [
  'Most Popular',
  'Newest',
  'Oldest',
  'Price: Low to High',
  'Price: High to Low',
  'Best Rated',
];

/** Legacy sort labels → current SORT_OPTIONS (backward compatible). */
export const SORT_ALIASES = {
  Popular: 'Most Popular',
  'Top Rated': 'Best Rated',
  'Date Added': 'Newest',
};

export const PRICE_RANGES = [
  { id: 'any', label: 'Any price', min: 0, max: Infinity },
  { id: 'under-50', label: 'Under $50', min: 0, max: 49.99 },
  { id: '50-250', label: '$50 – $250', min: 50, max: 250 },
  { id: '250-1000', label: '$250 – $1,000', min: 250.01, max: 1000 },
  { id: 'over-1000', label: 'Over $1,000', min: 1000.01, max: Infinity },
];

export const RATING_FILTERS = [
  { id: 0, label: 'Any rating' },
  { id: 4, label: '4.0 & up' },
  { id: 4.5, label: '4.5 & up' },
  { id: 4.8, label: '4.8 & up' },
];

export const FILE_TYPE_FILTERS = ['Account Transfer', 'Domain Transfer', 'Live Website', 'Full Source Code', 'License Key', 'Template File', 'Video Course', 'PDF'];

export const LICENSE_FILTERS = [
  { id: 'personal', label: 'Personal' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'extended', label: 'Extended' },
];

export const AVAILABILITY_FILTERS = [
  { id: 'any', label: 'Any availability' },
  { id: 'in_stock', label: 'In stock' },
  { id: 'out_of_stock', label: 'Out of stock' },
];

export const DEFAULT_FILTERS = {
  category: 'All',
  categoryId: null,
  sellerId: null,
  price: 'any',
  rating: 0,
  fileTypes: [],
  licenses: [],
  deliveryTime: 'any',
  availability: 'any',
  verifiedOnly: false,
};

export const DELIVERY_TIME_FILTERS = [
  { id: 'any', label: 'Any delivery time' },
  { id: 'instant', label: 'Instant Delivery' },
  { id: 'manual', label: 'Delivered within 24–48h' },
];

export const POPULAR_SEARCHES = ['Instagram account', 'Premium domain', 'SaaS starter kit', 'Source code', 'AI tool', 'Website'];

export const POPULAR_TAGS = ['social-account', 'domain', 'saas', 'source-code', 'mobile-app', 'ai-tool', 'template', 'commercial-use'];

export const RECENT_SEARCHES_KEY = 'pm_recent_searches';
export const MAX_RECENT_SEARCHES = 6;

export const PAGE_SIZE = 8;
