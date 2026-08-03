function idOf(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value._id || value.id || null;
}

function nameOf(value, fallback = '') {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return value.name || value.title || fallback;
}

const LISTING_TYPE_TO_PRODUCT_TYPE = {
  'social-account': 'social_accounts',
  'source-code': 'source_code',
  template: 'templates',
  account: 'social_accounts',
  digital: 'digital_files',
};

const PRODUCT_TYPE_TO_LISTING = {
  social_accounts: 'social-account',
  email_accounts: 'social-account',
  instagram: 'social-account',
  facebook: 'social-account',
  tiktok: 'social-account',
  twitter: 'social-account',
  telegram: 'social-account',
  discord: 'social-account',
  youtube: 'social-account',
  source_code: 'source-code',
  templates: 'template',
  digital_files: 'template',
};

/** Map backend product → seller dashboard listing shape (keeps existing UI fields). */
export function mapSellerProduct(product) {
  if (!product) return null;
  const category = product.category;
  const gallery = Array.isArray(product.gallery)
    ? product.gallery
    : (Array.isArray(product.images)
      ? product.images.map((img) => (typeof img === 'string' ? img : img?.url)).filter(Boolean)
      : []);
  const stock = product.stock ?? 0;
  const status = product.status === 'archived' ? 'disabled' : (product.status || 'draft');

  return {
    id: idOf(product),
    _id: idOf(product),
    title: product.title || '',
    slug: product.slug || '',
    shortDescription: product.shortDescription || '',
    description: product.description || '',
    whatsIncluded: product.whatsIncluded || product.digital?.deliveryInstructions || '',
    faq: Array.isArray(product.faq) ? product.faq : [],
    category: nameOf(category, product.categoryName || 'Uncategorized'),
    categoryId: idOf(category) || null,
    tags: Array.isArray(product.tags) ? product.tags.map(idOf).filter(Boolean) : [],
    price: Number(product.price || 0),
    salePrice: product.salePrice != null ? Number(product.salePrice) : null,
    thumbnail: product.thumbnail || gallery[0] || '',
    gallery,
    downloadFiles: [],
    previewImages: gallery,
    previewVideo: null,
    seoTitle: product.seoTitle || '',
    seoDescription: product.seoDescription || '',
    seoKeywords: Array.isArray(product.seoKeywords) ? product.seoKeywords : [],
    status,
    productAccounts: [],
    productFields: ['email', 'password', 'recovery', '2fa', 'cookie', 'token'],
    stockLogs: [],
    deliveries: [],
    analytics: {
      views: product.metrics?.views ?? 0,
      conversion: product.metrics?.conversion ?? 0,
      revenue: Number(product.metrics?.revenue || 0),
    },
    uploadedCount: product.uploadedCount ?? 0,
    soldCount: product.soldCount ?? product.salesCount ?? 0,
    reservedCount: product.reservedCount ?? 0,
    failedCount: product.failedCount ?? 0,
    downloads: product.downloads ?? product.soldCount ?? 0,
    rating: product.rating ?? null,
    reviewCount: product.reviewCount ?? 0,
    createdAt: product.createdAt || null,
    marketplaceType: product.productType?.includes('account') ? 'account' : 'digital',
    listingType: PRODUCT_TYPE_TO_LISTING[product.productType] || 'social-account',
    productType: product.productType || 'social_accounts',
    deliveryWindow: product.deliveryType === 'manual' ? '2-5 days' : 'Instant',
    deliveryType: product.deliveryType || 'automatic',
    inventoryType: product.stockType === 'unlimited' ? 'unlimited' : 'tracked',
    stock,
    stockType: product.stockType || 'limited',
    lowStockThreshold: product.lowStockThreshold ?? 5,
    verification: 'standard',
    handover: product.deliveryType === 'manual' ? 'guided' : 'self-serve',
    metrics: {
      views: product.metrics?.views ?? 0,
      conversion: product.metrics?.conversion ?? 0,
      revenue: Number(product.metrics?.revenue || 0),
    },
    approvalStatus: product.approvalStatus || null,
    visibility: product.visibility || 'public',
    raw: product,
  };
}

/** Map seller form → backend create/update payload. */
export function toBackendProductPayload(form, { publish = false } = {}) {
  const listingType = form.listingType || form.marketplaceType || 'social-account';
  const productType = form.productType
    || LISTING_TYPE_TO_PRODUCT_TYPE[listingType]
    || 'social_accounts';

  const allowedStatuses = new Set([
    'draft',
    'pending',
    'rejected',
    'live',
    'disabled',
    'out_of_stock',
    'archived',
  ]);
  let status = allowedStatuses.has(form.status) ? form.status : 'draft';
  if (publish && (status === 'draft' || status === 'rejected')) {
    status = 'pending';
  }

  const thumbnail = form.thumbnail && String(form.thumbnail).startsWith('http')
    ? form.thumbnail
    : (form.thumbnail && String(form.thumbnail).startsWith('data:') ? form.thumbnail : null);

  const gallery = (Array.isArray(form.gallery) ? form.gallery : [])
    .filter((url) => typeof url === 'string' && (url.startsWith('http') || url.startsWith('data:')))
    .slice(0, 10);

  const seoKeywords = Array.isArray(form.seoKeywords)
    ? form.seoKeywords
    : String(form.seoKeywords || form.tagsText || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const payload = {
    title: String(form.title || '').trim(),
    shortDescription: String(form.shortDescription || '').trim() || undefined,
    description: String(form.description || '').trim() || undefined,
    price: Number(form.price || 0),
    productType,
    deliveryType: form.deliveryType === 'manual' ? 'manual' : 'automatic',
    stock: Number(form.stock || 0),
    stockType: form.inventoryType === 'unlimited' || form.stockType === 'unlimited'
      ? 'unlimited'
      : 'limited',
    status,
    visibility: form.visibility || 'public',
    seoTitle: form.seoTitle || undefined,
    seoDescription: form.seoDescription || undefined,
    seoKeywords: seoKeywords.length ? seoKeywords : undefined,
    digital: {
      downloadType: form.deliveryType === 'manual' ? 'manual' : 'automatic',
      manual: form.deliveryType === 'manual',
      automatic: form.deliveryType !== 'manual',
      deliveryInstructions: form.whatsIncluded || undefined,
    },
  };

  if (thumbnail) payload.thumbnail = thumbnail;
  if (gallery.length) payload.gallery = gallery;
  if (form.categoryId) payload.category = form.categoryId;

  return payload;
}

export default {
  mapSellerProduct,
  toBackendProductPayload,
  LISTING_TYPE_TO_PRODUCT_TYPE,
};
