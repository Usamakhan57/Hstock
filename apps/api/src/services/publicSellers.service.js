import { AppError } from '../utils/AppError.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { SellerProfile } from '../models/index.js';
import { SellerStatusEnum } from '../constants/enums.js';

const PUBLIC_SELLER_FIELDS = [
  'storeName',
  'slug',
  'logo',
  'avatar',
  'banner',
  'bio',
  'specialty',
  'status',
  'verified',
  'verifiedAt',
  'verificationSource',
  'storePromotionActive',
  'storePromotedUntil',
  'metrics',
  'joinedAt',
  'country',
  'defaultProcessingTime',
].join(' ');

function isPromotionLive(seller, now = new Date()) {
  return seller?.storePromotionActive === true
    && seller?.storePromotedUntil
    && new Date(seller.storePromotedUntil).getTime() > now.getTime();
}

export function serializePublicSeller(doc) {
  if (!doc) return null;
  const raw = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  const metrics = raw.metrics || {};
  const verified = raw.verified === true;
  const storePromoted = isPromotionLive(raw);
  return {
    _id: raw._id,
    id: String(raw._id || raw.id),
    storeName: raw.storeName,
    name: raw.storeName,
    slug: raw.slug,
    logo: raw.logo || raw.avatar || null,
    avatar: raw.avatar || raw.logo || null,
    banner: raw.banner || null,
    bio: raw.bio || '',
    specialty: raw.specialty || '',
    status: raw.status,
    verified,
    sellerVerified: verified,
    verifiedAt: raw.verifiedAt || null,
    storePromotionActive: storePromoted,
    storePromoted,
    storePromotedUntil: storePromoted ? raw.storePromotedUntil : null,
    metrics: {
      productsCount: metrics.productsCount ?? 0,
      totalSales: metrics.totalSales ?? 0,
      rating: metrics.rating ?? 0,
      responseTime: metrics.responseTime || raw.defaultProcessingTime || null,
    },
    productCount: metrics.productsCount ?? 0,
    rating: metrics.rating ?? null,
    totalSalesAmount: metrics.totalSales ?? 0,
    responseTime: metrics.responseTime || raw.defaultProcessingTime || null,
    joinedAt: raw.joinedAt || null,
    country: raw.country || null,
  };
}

/**
 * Public approved sellers for Featured Stores / storefront cards.
 */
export async function listPublicSellers(query = {}) {
  const pagination = parsePagination(query, { page: 1, limit: 24, maxLimit: 100 });
  const filter = {
    status: SellerStatusEnum.Approved,
    deleted: { $ne: true },
  };
  if (query.verified === 'true') filter.verified = true;
  if (query.promoted === 'true') {
    filter.storePromotionActive = true;
    filter.storePromotedUntil = { $gt: new Date() };
  }
  if (query.search) {
    const re = new RegExp(String(query.search).trim(), 'i');
    filter.$or = [{ storeName: re }, { slug: re }, { specialty: re }];
  }

  const [items, total] = await Promise.all([
    SellerProfile.find(filter)
      .select(PUBLIC_SELLER_FIELDS)
      .sort({ storePromotionActive: -1, storePromotedUntil: -1, 'metrics.totalSales': -1, createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    SellerProfile.countDocuments(filter),
  ]);

  return {
    items: items.map(serializePublicSeller),
    meta: buildPaginationMeta({ ...pagination, total }),
  };
}

export async function getPublicSellerBySlug(slug) {
  if (!slug) {
    throw new AppError('Seller slug is required', 400, { code: 'VALIDATION_ERROR' });
  }
  const seller = await SellerProfile.findOne({
    slug: String(slug).toLowerCase().trim(),
    status: SellerStatusEnum.Approved,
    deleted: { $ne: true },
  })
    .select(PUBLIC_SELLER_FIELDS)
    .lean();

  if (!seller) {
    throw new AppError('Seller not found', 404, { code: 'SELLER_NOT_FOUND' });
  }
  return serializePublicSeller(seller);
}

export default {
  listPublicSellers,
  getPublicSellerBySlug,
  serializePublicSeller,
};
