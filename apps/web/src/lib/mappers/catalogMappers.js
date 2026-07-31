/**
 * Map backend catalog entities → existing storefront UI shapes.
 * Keeps pages/components unchanged.
 */

function idOf(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value._id || value.id || null;
}

function nameOf(value, fallback = '') {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return value.name || value.storeName || value.title || fallback;
}

function slugOf(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value.slug || null;
}

export function mapBackendCategory(category) {
  if (!category) return null;
  return {
    id: idOf(category),
    _id: idOf(category),
    name: category.name,
    slug: category.slug,
    description: category.description || '',
    parentId: idOf(category.parent) || null,
    parent: idOf(category.parent) || null,
    image: category.image || category.icon || null,
    icon: category.icon || null,
    featured: !!category.featured,
    showOnHomepage: !!category.showOnHomepage,
    showInHeader: !!category.showInHeader,
    status: category.status || 'active',
    productCount: category.productCount ?? 0,
    children: Array.isArray(category.children)
      ? category.children.map(mapBackendCategory)
      : [],
  };
}

export function mapBackendProduct(product) {
  if (!product) return null;

  const category = product.category;
  const brand = product.brand;
  const seller = product.seller;
  const images = Array.isArray(product.images) && product.images.length
    ? product.images.map((img) => (typeof img === 'string' ? img : img?.url)).filter(Boolean)
    : (Array.isArray(product.gallery) ? product.gallery : []);
  const gallery = images.length
    ? images
    : [product.thumbnail].filter(Boolean);
  const img = product.thumbnail || gallery[0] || null;

  const artist = nameOf(seller?.storeName || seller)
    || nameOf(brand)
    || product.artist
    || 'ApnaStore';

  const cat = nameOf(category, product.cat || 'Digital Assets');
  const catSlug = slugOf(category) || product.catSlug || null;
  const sellerVerified = seller?.verified === true
    || seller?.status === 'approved'
    || !!product.verifiedSeller;

  const features = Array.isArray(product.features)
    ? product.features
    : (Array.isArray(product.whatsIncluded)
      ? product.whatsIncluded
      : (typeof product.whatsIncluded === 'string' && product.whatsIncluded
        ? product.whatsIncluded.split('\n').map((s) => s.trim()).filter(Boolean)
        : []));

  const specifications = product.specifications && typeof product.specifications === 'object'
    ? product.specifications
    : {
        productType: product.productType || null,
        assetPlatform: product.assetPlatform || null,
        licenseType: product.licenseType || null,
        deliveryType: product.deliveryType || null,
        fileSize: product.digital?.fileSize || product.fileSize || null,
        fileType: product.digital?.fileType || null,
        stockType: product.stockType || null,
        sku: product.sku || null,
      };

  return {
    id: idOf(product),
    _id: idOf(product),
    title: product.title,
    slug: product.slug,
    categoryId: idOf(category),
    cat,
    catSlug,
    price: Number(product.price) || 0,
    old: product.compareAtPrice != null ? Number(product.compareAtPrice) : null,
    img,
    images: gallery.length ? gallery : [img].filter(Boolean),
    badge: product.featured ? 'Featured' : (product.badge || null),
    rating: product.rating != null ? Number(product.rating) : null,
    reviewCount: product.reviewCount != null ? Number(product.reviewCount) : 0,
    downloads: product.salesCount ?? product.downloads ?? 0,
    salesCount: product.salesCount ?? product.downloads ?? 0,
    featured: !!product.featured,
    artist,
    artistSlug: seller?.storeSlug || slugOf(seller) || slugOf(brand) || null,
    sellerSlug: seller?.storeSlug || slugOf(seller) || null,
    sellerId: idOf(seller),
    verifiedSeller: sellerVerified,
    brandId: idOf(brand),
    fileTypes: Array.isArray(product.fileTypes) && product.fileTypes.length
      ? product.fileTypes
      : [product.productType || 'Digital Download'].filter(Boolean),
    dimensions: product.dimensions || null,
    version: product.version || null,
    description: product.description || '',
    shortDescription: product.shortDescription || '',
    whatsIncluded: product.whatsIncluded || '',
    features,
    specifications,
    licenseIds: Array.isArray(product.licenseIds) && product.licenseIds.length
      ? product.licenseIds
      : ['personal', 'commercial'],
    licenses: Array.isArray(product.licenses) ? product.licenses : [],
    faqs: Array.isArray(product.faqs) ? product.faqs : (Array.isArray(product.faq) ? product.faq : []),
    productType: product.productType || 'digital',
    deliveryType: product.deliveryType || null,
    shipping: product.shipping || null,
    sku: product.sku || null,
    stock: product.stock ?? null,
    unlimitedStock: product.stockType === 'unlimited',
    stockType: product.stockType || null,
    fileSize: product.digital?.fileSize || product.fileSize || null,
    liveDemoUrl: product.liveDemoUrl || null,
    digital: product.digital || null,
    createdAt: product.createdAt || null,
    updatedAt: product.updatedAt || null,
    publishedAt: product.publishedAt || null,
    status: product.status,
    approvalStatus: product.approvalStatus,
    assetIdentifier: product.assetIdentifier || null,
    assetPlatform: product.assetPlatform || null,
    tags: Array.isArray(product.tags)
      ? product.tags.map((t) => (typeof t === 'string' ? t : t?.name)).filter(Boolean)
      : [],
  };
}

export function mapBackendSeller(seller) {
  if (!seller) return null;
  const metrics = seller.metrics || {};
  return {
    id: idOf(seller),
    _id: idOf(seller),
    name: seller.storeName || seller.name || 'Seller',
    slug: seller.storeSlug || seller.slug || idOf(seller),
    bio: seller.bio || '',
    avatar: seller.avatar || seller.logo || null,
    logo: seller.logo || seller.avatar || null,
    banner: seller.banner || null,
    verified: seller.verified === true || seller.status === 'approved',
    specialty: seller.specialty || '',
    productCount: metrics.productsCount ?? seller.productCount ?? 0,
    rating: metrics.rating ?? seller.rating ?? null,
    totalSalesAmount: metrics.totalSales ?? seller.totalSalesAmount ?? 0,
    responseTime: metrics.responseTime || seller.responseTime || seller.defaultProcessingTime || null,
    joined: seller.joinedAt
      ? new Date(seller.joinedAt).getFullYear().toString()
      : (seller.joined || null),
    website: seller.website || null,
    country: seller.country || null,
  };
}

export default {
  mapBackendCategory,
  mapBackendProduct,
  mapBackendSeller,
};
