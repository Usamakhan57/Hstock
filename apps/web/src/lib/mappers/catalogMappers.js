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
    status: category.status || 'active',
    productCount: category.productCount ?? 0,
    children: Array.isArray(category.children)
      ? category.children.map(mapBackendCategory)
      : [],
  };
}

export function mapBackendCollection(collection) {
  if (!collection) return null;
  return {
    id: idOf(collection),
    _id: idOf(collection),
    name: collection.name,
    slug: collection.slug,
    description: collection.description || '',
    image: collection.image || collection.coverImage || null,
    coverImage: collection.coverImage || collection.image || null,
    featured: !!collection.featured,
    productCount: collection.productCount ?? 0,
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
    || 'HStock';

  const cat = nameOf(category, product.cat || 'Digital Assets');
  const catSlug = slugOf(category) || product.catSlug || null;

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
    rating: product.rating ?? 4.5,
    reviewCount: product.reviewCount ?? 0,
    downloads: product.salesCount ?? product.downloads ?? 0,
    promoted: !!product.promoted,
    featured: !!product.featured,
    promotionLabel: product.promotionLabel || null,
    artist,
    artistSlug: slugOf(seller) || slugOf(brand) || null,
    sellerSlug: slugOf(seller) || null,
    sellerId: idOf(seller),
    brandId: idOf(brand),
    collectionId: idOf(product.collection),
    fileTypes: Array.isArray(product.fileTypes) && product.fileTypes.length
      ? product.fileTypes
      : [product.productType || 'Digital Download'],
    dimensions: product.dimensions || null,
    version: product.version || null,
    description: product.description || '',
    shortDescription: product.shortDescription || '',
    whatsIncluded: product.whatsIncluded || '',
    licenseIds: Array.isArray(product.licenseIds) && product.licenseIds.length
      ? product.licenseIds
      : ['personal', 'commercial'],
    licenses: Array.isArray(product.licenses) ? product.licenses : [],
    faqs: Array.isArray(product.faqs) ? product.faqs : (Array.isArray(product.faq) ? product.faq : []),
    productType: product.productType || 'digital',
    shipping: product.shipping || null,
    sku: product.sku || null,
    stock: product.stock ?? null,
    unlimitedStock: product.stockType === 'unlimited',
    fileSize: product.fileSize || null,
    liveDemoUrl: product.liveDemoUrl || null,
    digital: product.digital || null,
    createdAt: product.createdAt || null,
    updatedAt: product.updatedAt || null,
    status: product.status,
    approvalStatus: product.approvalStatus,
    assetIdentifier: product.assetIdentifier || null,
    assetPlatform: product.assetPlatform || null,
  };
}

export function mapBackendSeller(seller) {
  if (!seller) return null;
  return {
    id: idOf(seller),
    _id: idOf(seller),
    name: seller.storeName || seller.name || 'Seller',
    slug: seller.storeSlug || seller.slug || idOf(seller),
    bio: seller.bio || '',
    avatar: seller.avatar || seller.logo || null,
    logo: seller.logo || seller.avatar || null,
    verified: seller.status === 'approved' || !!seller.verified,
    specialty: seller.specialty || '',
    productCount: seller.productCount ?? 0,
  };
}

export default {
  mapBackendCategory,
  mapBackendCollection,
  mapBackendProduct,
  mapBackendSeller,
};
