import {
  Product,
  ProductImage,
  DigitalProduct,
  SellerProfile,
  Tag,
} from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { toSlug } from '../utils/slug.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { withTransaction } from '../utils/transaction.js';
import { objectIdSchema } from '../validators/common.validator.js';
import {
  PRODUCT_STATUS,
  APPROVAL_STATUS,
  PRODUCT_VISIBILITY,
  DOWNLOAD_TYPES,
} from '../constants/productTypes.js';
import { USER_ROLES } from '../constants/roles.js';
import { normalizeAssetIdentifier } from '../helpers/asset.helper.js';
import {
  prepareAssetFields,
  assertAssetAvailable,
  syncProductAssetClaim,
  releaseDigitalAssetClaim,
  wrapDuplicateAssetError,
} from './assetUniqueness.service.js';

async function ensureUniqueProductSlug(base, excludeId = null) {
  let slug = toSlug(base);
  if (!slug) slug = 'product';
  let attempt = 0;
  while (true) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt}`;
    const filter = { slug: candidate };
    if (excludeId) filter._id = { $ne: excludeId };
    // eslint-disable-next-line no-await-in-loop
    const exists = await Product.findOne(filter).select('_id').lean();
    if (!exists) return candidate;
    attempt += 1;
  }
}

function isObjectId(value) {
  return objectIdSchema.safeParse(String(value ?? '')).success;
}

async function resolveSellerForUser(user) {
  const seller = await SellerProfile.findOne({ user: user.id || user._id });
  return seller;
}

export async function listProducts(query = {}, actor = null) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { deletedAt: null };

  const isStaff = actor?.roles?.some((role) =>
    [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.EDITOR].includes(role),
  );

  if (isStaff) {
    if (query.status) filter.status = query.status;
    if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;
  } else if (actor?.roles?.includes(USER_ROLES.SELLER) && query.mine === 'true') {
    const seller = await resolveSellerForUser(actor);
    if (!seller) {
      return { items: [], meta: buildPaginationMeta({ page, limit, total: 0 }) };
    }
    filter.seller = seller._id;
    if (query.status) filter.status = query.status;
  } else {
    filter.status = PRODUCT_STATUS.LIVE;
    filter.visibility = PRODUCT_VISIBILITY.PUBLIC;
    filter.approvalStatus = APPROVAL_STATUS.APPROVED;
  }

  if (query.category) filter.category = query.category;
  if (query.brand) filter.brand = query.brand;
  if (query.collection) filter.collection = query.collection;
  if (query.productType) filter.productType = query.productType;
  if (query.seller) filter.seller = query.seller;
  if (query.featured !== undefined) filter.featured = query.featured === 'true';
  if (query.tag) filter.tags = query.tag;
  if (query.assetPlatform) filter.assetPlatform = query.assetPlatform;

  // Search by normalized asset identifier (exact global identity match)
  if (query.assetIdentifier || query.assetIdentifierNormalized) {
    const normalized = query.assetIdentifierNormalized
      || normalizeAssetIdentifier(query.assetIdentifier, {
        productType: query.productType || null,
        assetPlatform: query.assetPlatform || null,
      });
    if (normalized) {
      filter.assetIdentifierNormalized = normalized;
    }
  }

  if (query.search) {
    const rawSearch = String(query.search).trim();
    const searchNormalized = normalizeAssetIdentifier(rawSearch, {
      productType: query.productType || null,
      assetPlatform: query.assetPlatform || null,
    });
    const looksLikeAsset = Boolean(
      searchNormalized
      && (
        rawSearch.includes('@')
        || rawSearch.includes('://')
        || rawSearch.startsWith('@')
        || rawSearch.includes('.')
      ),
    );

    if (looksLikeAsset) {
      filter.assetIdentifierNormalized = searchNormalized;
    } else {
      filter.$text = { $search: query.search };
    }
  }

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .populate('collection', 'name slug')
      .populate('tags', 'name slug')
      .populate('seller', 'storeName slug status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return { items, meta: buildPaginationMeta({ page, limit, total }) };
}

async function loadProductDocument(idOrSlug) {
  const key = String(idOrSlug);
  const filter = isObjectId(key)
    ? { $or: [{ _id: key }, { slug: key }], deletedAt: null }
    : { slug: key, deletedAt: null };

  return Product.findOne(filter)
    .populate('category', 'name slug')
    .populate('brand', 'name slug')
    .populate('collection', 'name slug')
    .populate('tags', 'name slug')
    .populate('seller', 'storeName slug status verified user')
    .lean();
}

async function attachProductMedia(product) {
  const [images, digital] = await Promise.all([
    ProductImage.find({ product: product._id }).sort({ sortOrder: 1 }).lean(),
    DigitalProduct.findOne({ product: product._id }).lean(),
  ]);
  return { ...product, images, digital };
}

export async function getProduct(idOrSlug, actor = null, options = {}) {
  const product = await loadProductDocument(idOrSlug);

  if (!product) {
    throw new AppError('Product not found', 404, { code: 'PRODUCT_NOT_FOUND' });
  }

  if (!options.skipAccessCheck) {
    const isStaff = actor?.roles?.some((role) =>
      [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.EDITOR].includes(role),
    );

    let isOwner = false;
    if (actor?.roles?.includes(USER_ROLES.SELLER)) {
      const sellerProfile = await resolveSellerForUser(actor);
      const sellerId = product.seller?._id || product.seller;
      isOwner = Boolean(
        sellerProfile && sellerId && String(sellerId) === String(sellerProfile._id),
      );
    }

    if (
      !isStaff
      && !isOwner
      && (
        product.status !== PRODUCT_STATUS.LIVE
        || product.visibility !== PRODUCT_VISIBILITY.PUBLIC
        || product.approvalStatus !== APPROVAL_STATUS.APPROVED
      )
    ) {
      throw new AppError('Product not found', 404, { code: 'PRODUCT_NOT_FOUND' });
    }
  }

  return attachProductMedia(product);
}

export async function createProduct(payload, actor) {
  let sellerId = payload.seller || null;

  if (
    actor.roles.includes(USER_ROLES.SELLER)
    && !actor.roles.includes(USER_ROLES.ADMIN)
    && !actor.roles.includes(USER_ROLES.SUPER_ADMIN)
  ) {
    const seller = await resolveSellerForUser(actor);
    if (!seller) {
      throw new AppError('Seller profile required', 403, { code: 'SELLER_REQUIRED' });
    }
    sellerId = seller._id;
  }

  const slug = await ensureUniqueProductSlug(payload.slug || payload.title);
  const assetFields = prepareAssetFields(payload);
  const status = payload.status || PRODUCT_STATUS.DRAFT;

  if (assetFields.assetIdentifierNormalized) {
    await assertAssetAvailable(assetFields.assetIdentifierNormalized);
  }

  let product;
  try {
    product = await withTransaction(async (session) => {
      const createOpts = session ? { session } : undefined;
      const docPayload = {
        ...payload,
        ...assetFields,
        slug,
        seller: sellerId,
        status,
        approvalStatus: payload.approvalStatus || APPROVAL_STATUS.PENDING,
        createdBy: actor.id,
        updatedBy: actor.id,
      };

      const productDoc = session
        ? (await Product.create([docPayload], createOpts))[0]
        : await Product.create(docPayload);

      if (payload.gallery?.length) {
        const images = payload.gallery.map((url, index) => ({
          product: productDoc._id,
          url,
          sortOrder: index,
          isPrimary: index === 0,
          createdBy: actor.id,
        }));
        if (session) {
          await ProductImage.create(images, { session });
        } else {
          await ProductImage.insertMany(images);
        }
      }

      if (payload.digital) {
        const digital = payload.digital;
        const digitalDoc = {
          product: productDoc._id,
          downloadType: digital.downloadType || DOWNLOAD_TYPES.MANUAL,
          manual: digital.manual ?? digital.downloadType !== DOWNLOAD_TYPES.AUTOMATIC,
          automatic: digital.automatic ?? digital.downloadType === DOWNLOAD_TYPES.AUTOMATIC,
          licenseKey: digital.licenseKey || null,
          downloadUrl: digital.downloadUrl || null,
          externalUrl: digital.externalUrl || null,
          deliveryInstructions: digital.deliveryInstructions || '',
          fileSize: digital.fileSize ?? null,
          fileType: digital.fileType || null,
        };
        if (session) {
          await DigitalProduct.create([digitalDoc], { session });
        } else {
          await DigitalProduct.create(digitalDoc);
        }
      }

      if (payload.tags?.length) {
        await Tag.updateMany(
          { _id: { $in: payload.tags } },
          { $inc: { productCount: 1 } },
          session ? { session } : undefined,
        );
      }

      await syncProductAssetClaim(productDoc, { session });

      return productDoc;
    });
  } catch (error) {
    throw wrapDuplicateAssetError(error);
  }

  return getProduct(product._id, actor, { skipAccessCheck: true });
}

export async function updateProduct(id, payload, actor) {
  const product = await Product.findOne({ _id: id, deletedAt: null });
  if (!product) {
    throw new AppError('Product not found', 404, { code: 'PRODUCT_NOT_FOUND' });
  }

  const isStaff = actor.roles.some((role) =>
    [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.EDITOR].includes(role),
  );

  if (!isStaff) {
    const seller = await resolveSellerForUser(actor);
    if (!seller || String(product.seller) !== String(seller._id)) {
      throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
    }
  }

  if (payload.title || payload.slug) {
    payload.slug = await ensureUniqueProductSlug(
      payload.slug || payload.title || product.title,
      product._id,
    );
  }

  const { digital, gallery, ...productFields } = payload;
  const assetFields = prepareAssetFields(payload, product);

  const nextStatus = productFields.status ?? product.status;
  const nextNormalized = assetFields.assetIdentifierNormalized;

  if (
    nextNormalized
    && nextNormalized !== product.assetIdentifierNormalized
  ) {
    await assertAssetAvailable(nextNormalized, { excludeProductId: product._id });
  } else if (
    nextNormalized
    && productFields.status
    && productFields.status !== product.status
  ) {
    await assertAssetAvailable(nextNormalized, { excludeProductId: product._id });
  }

  Object.assign(product, productFields, assetFields, { updatedBy: actor.id });

  try {
    await withTransaction(async (session) => {
      if (session) {
        await product.save({ session });
      } else {
        await product.save();
      }

      if (gallery) {
        await ProductImage.deleteMany(
          { product: product._id },
          session ? { session } : undefined,
        );
        if (gallery.length) {
          const images = gallery.map((url, index) => ({
            product: product._id,
            url,
            sortOrder: index,
            isPrimary: index === 0,
            createdBy: actor.id,
          }));
          if (session) {
            await ProductImage.create(images, { session });
          } else {
            await ProductImage.insertMany(images);
          }
          product.gallery = gallery;
          product.thumbnail = product.thumbnail || gallery[0];
          if (session) {
            await product.save({ session });
          } else {
            await product.save();
          }
        }
      }

      if (digital) {
        await DigitalProduct.findOneAndUpdate(
          { product: product._id },
          {
            $set: {
              downloadType: digital.downloadType,
              manual: digital.manual,
              automatic: digital.automatic,
              licenseKey: digital.licenseKey,
              downloadUrl: digital.downloadUrl,
              externalUrl: digital.externalUrl,
              deliveryInstructions: digital.deliveryInstructions,
              fileSize: digital.fileSize,
              fileType: digital.fileType,
            },
          },
          { upsert: true, new: true, ...(session ? { session } : {}) },
        );
      }

      // Ensure status used for claim sync reflects latest values
      product.status = nextStatus;
      await syncProductAssetClaim(product, { session });
    });
  } catch (error) {
    throw wrapDuplicateAssetError(error);
  }

  return getProduct(product._id, actor, { skipAccessCheck: true });
}

export async function deleteProduct(id, actor) {
  const product = await Product.findOne({ _id: id, deletedAt: null });
  if (!product) {
    throw new AppError('Product not found', 404, { code: 'PRODUCT_NOT_FOUND' });
  }

  const isStaff = actor.roles.some((role) =>
    [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(role),
  );

  if (!isStaff) {
    const seller = await resolveSellerForUser(actor);
    if (!seller || String(product.seller) !== String(seller._id)) {
      throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
    }
  }

  product.deletedAt = new Date();
  product.status = PRODUCT_STATUS.ARCHIVED;
  product.updatedBy = actor.id;

  await withTransaction(async (session) => {
    if (session) {
      await product.save({ session });
    } else {
      await product.save();
    }
    await releaseDigitalAssetClaim(product._id, { session });
  });

  return { deleted: true, id: product._id };
}

export async function submitProduct(id, actor) {
  const product = await Product.findOne({ _id: id, deletedAt: null });
  if (!product) {
    throw new AppError('Product not found', 404, { code: 'PRODUCT_NOT_FOUND' });
  }

  const seller = await resolveSellerForUser(actor);
  const isStaff = actor.roles.some((role) =>
    [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(role),
  );

  if (!isStaff && (!seller || String(product.seller) !== String(seller._id))) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }

  if (product.assetIdentifierNormalized) {
    await assertAssetAvailable(product.assetIdentifierNormalized, {
      excludeProductId: product._id,
    });
  }

  product.status = PRODUCT_STATUS.PENDING;
  product.approvalStatus = APPROVAL_STATUS.PENDING;
  product.updatedBy = actor.id;

  try {
    await withTransaction(async (session) => {
      if (session) {
        await product.save({ session });
      } else {
        await product.save();
      }
      await syncProductAssetClaim(product, { session });
    });
  } catch (error) {
    throw wrapDuplicateAssetError(error);
  }

  return getProduct(product._id, actor, { skipAccessCheck: true });
}

export async function moderateProduct(id, payload, actor) {
  const product = await Product.findOne({ _id: id, deletedAt: null });
  if (!product) {
    throw new AppError('Product not found', 404, { code: 'PRODUCT_NOT_FOUND' });
  }

  if (payload.approvalStatus === APPROVAL_STATUS.APPROVED) {
    product.approvalStatus = APPROVAL_STATUS.APPROVED;
    product.status = PRODUCT_STATUS.LIVE;
    product.publishedAt = new Date();
  } else if (payload.approvalStatus === APPROVAL_STATUS.REJECTED) {
    product.approvalStatus = APPROVAL_STATUS.REJECTED;
    product.status = PRODUCT_STATUS.REJECTED;
  }

  if (payload.status) product.status = payload.status;
  if (payload.featured !== undefined) product.featured = payload.featured;

  product.updatedBy = actor.id;

  if (product.assetIdentifierNormalized) {
    await assertAssetAvailable(product.assetIdentifierNormalized, {
      excludeProductId: product._id,
    });
  }

  try {
    await withTransaction(async (session) => {
      if (session) {
        await product.save({ session });
      } else {
        await product.save();
      }
      await syncProductAssetClaim(product, { session });
    });
  } catch (error) {
    throw wrapDuplicateAssetError(error);
  }

  return getProduct(product._id, actor, { skipAccessCheck: true });
}

export default {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  submitProduct,
  moderateProduct,
};
