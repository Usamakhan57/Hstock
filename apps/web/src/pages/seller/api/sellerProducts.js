/**
 * Seller product CRUD for the HStock-style storefront hub.
 *
 * The seller experience now uses richer listing metadata (account vs. digital,
 * delivery window, promotions, stock, revenue hints) while keeping the same
 * mock REST contract so it can be swapped to a real API later with no UI change.
 */
import { createResource } from '../../../admin/api/db';
import { loadStorefrontProducts } from '../../../services/productRepository';

const STATUSES = ['live', 'live', 'draft', 'pending', 'rejected', 'out_of_stock', 'disabled'];
const LISTING_TYPES = ['social-account', 'source-code', 'template'];
const DELIVERY_WINDOWS = ['Instant', '24-48h', '2-5 days'];

function buildSeed() {
  return loadStorefrontProducts().slice(0, 10).map((p, i) => ({
    id: p.id,
    title: p.title,
    shortDescription: p.shortDescription || p.description?.replace(/<[^>]+>/g, '').slice(0, 120) || 'Premium marketplace listing',
    description: p.description || '',
    whatsIncluded: p.whatsIncluded || '',
    faq: Array.isArray(p.faqs) ? p.faqs : [],
    category: p.cat,
    categoryId: p.categoryId || null,
    tags: p.tags || [],
    price: p.price,
    salePrice: p.old || null,
    thumbnail: p.img,
    gallery: Array.isArray(p.images) ? p.images : [],
    downloadFiles: [],
    previewImages: [],
    previewVideo: null,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [],
    status: STATUSES[i % STATUSES.length],
    productAccounts: [],
    productFields: ['email', 'password', 'recovery', '2fa', 'cookie', 'token'],
    stockLogs: [],
    deliveries: [],
    analytics: {
      views: 200 + i * 80,
      conversion: 5 + (i % 4),
      revenue: Number((p.price * (1.07 + (i % 3) * 0.04)).toFixed(2)),
    },
    bulkDiscounts: i % 2 === 0 ? [{ minQuantity: 5, percentage: 10, label: 'Volume deal' }] : [],
    promotions: i % 3 === 0 ? [{ label: 'Weekend deal', discount: 12 }] : [],
    uploadedCount: 0,
    soldCount: 0,
    reservedCount: 0,
    failedCount: 0,
    downloads: p.downloads || 0,
    rating: p.rating ?? 4.5,
    reviewCount: p.reviewCount || 0,
    createdAt: new Date(Date.now() - (i + 1) * 3 * 24 * 60 * 60 * 1000).toISOString(),
    marketplaceType: i % 2 === 0 ? 'account' : 'digital',
    listingType: LISTING_TYPES[i % LISTING_TYPES.length],
    deliveryWindow: DELIVERY_WINDOWS[i % DELIVERY_WINDOWS.length],
    inventoryType: p.stock != null ? 'tracked' : 'unlimited',
    stock: p.stock ?? 999,
    lowStockThreshold: p.lowStockThreshold ?? 5,
    promoted: i % 4 === 0,
    featured: p.featured || i % 5 === 0,
    verification: i % 3 === 0 ? 'verified' : 'standard',
    handover: i % 2 === 0 ? 'guided' : 'self-serve',
    promotionLabel: i % 3 === 0 ? 'New Listing' : i % 3 === 1 ? 'Weekend Deal' : null,
    metrics: {
      views: 300 + i * 140,
      conversion: 6 + (i % 5),
      revenue: Number((p.price * (1.15 + (i % 4) * 0.08)).toFixed(2)),
    },
  }));
}

const resource = createResource('seller_products', buildSeed());

export const getSellerProducts = resource.getAll;
export const getSellerProduct = resource.getById;
export const createSellerProduct = resource.create;
export const updateSellerProduct = resource.update;
export const deleteSellerProduct = resource.remove;
