import { DigitalAssetClaim, Product } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import {
  normalizeAssetIdentifier,
  resolveAssetKind,
} from '../helpers/asset.helper.js';
import {
  ASSET_BLOCKING_STATUSES,
  ASSET_CLAIM_STATUS,
  ASSET_DUPLICATE_CODE,
  ASSET_DUPLICATE_MESSAGE,
  ASSET_PLATFORMS,
  isBlockingProductStatus,
} from '../constants/assetUniqueness.js';

function isDuplicateKeyError(error) {
  return error?.code === 11000
    || error?.codeName === 'DuplicateKey'
    || Boolean(error?.keyPattern?.assetIdentifierNormalized);
}

export function duplicateAssetError(details) {
  return new AppError(ASSET_DUPLICATE_MESSAGE, 409, {
    code: ASSET_DUPLICATE_CODE,
    details,
  });
}

/**
 * Derive persisted asset identifier fields from a create/update payload.
 * assetIdentifier is optional for backward compatibility.
 */
export function prepareAssetFields(payload = {}, existing = null) {
  const hasIdentifier = Object.prototype.hasOwnProperty.call(payload, 'assetIdentifier');
  const raw = hasIdentifier
    ? payload.assetIdentifier
    : existing?.assetIdentifier;

  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return {
      assetIdentifier: null,
      assetIdentifierNormalized: null,
      assetPlatform: hasIdentifier
        ? (payload.assetPlatform || null)
        : (existing?.assetPlatform ?? null),
    };
  }

  const productType = payload.productType ?? existing?.productType ?? null;
  const platformHint = payload.assetPlatform
    ?? existing?.assetPlatform
    ?? null;
  const kind = resolveAssetKind(productType, platformHint, raw);
  const platform = Object.values(ASSET_PLATFORMS).includes(kind)
    ? kind
    : ASSET_PLATFORMS.GENERIC;

  const normalized = normalizeAssetIdentifier(raw, {
    productType,
    assetPlatform: platform,
  });

  return {
    assetIdentifier: String(raw).trim(),
    assetIdentifierNormalized: normalized,
    assetPlatform: platform,
  };
}

export async function assertAssetAvailable(
  assetIdentifierNormalized,
  { excludeProductId = null, session = null } = {},
) {
  if (!assetIdentifierNormalized) return;

  const claimFilter = {
    assetIdentifierNormalized,
    status: ASSET_CLAIM_STATUS.CLAIMED,
  };
  if (excludeProductId) {
    claimFilter.product = { $ne: excludeProductId };
  }

  const claimQuery = DigitalAssetClaim.findOne(claimFilter).select('_id product');
  if (session) claimQuery.session(session);
  const claim = await claimQuery.lean();
  if (claim) {
    throw duplicateAssetError({ productId: claim.product });
  }

  const productFilter = {
    assetIdentifierNormalized,
    deletedAt: null,
    status: { $in: ASSET_BLOCKING_STATUSES },
  };
  if (excludeProductId) {
    productFilter._id = { $ne: excludeProductId };
  }

  const productQuery = Product.findOne(productFilter).select('_id');
  if (session) productQuery.session(session);
  const product = await productQuery.lean();
  if (product) {
    throw duplicateAssetError({ productId: product._id });
  }
}

/**
 * Claim (or re-claim) a normalized asset for a product.
 * Uses unique index + conditional update to prevent race duplicates.
 */
export async function claimDigitalAsset({
  productId,
  sellerId = null,
  assetIdentifier,
  assetIdentifierNormalized,
  assetPlatform,
  productType,
  session = null,
} = {}) {
  if (!assetIdentifierNormalized) return null;

  const now = new Date();
  const fields = {
    assetIdentifier,
    assetIdentifierNormalized,
    assetPlatform: assetPlatform || ASSET_PLATFORMS.GENERIC,
    productType: productType || null,
    product: productId,
    seller: sellerId,
    status: ASSET_CLAIM_STATUS.CLAIMED,
    claimedAt: now,
    releasedAt: null,
  };

  const findOpts = session ? { session } : undefined;

  // Re-claim released row, or refresh this product's own claim
  const updated = await DigitalAssetClaim.findOneAndUpdate(
    {
      assetIdentifierNormalized,
      $or: [
        { status: ASSET_CLAIM_STATUS.RELEASED },
        { product: productId },
      ],
    },
    { $set: fields },
    { new: true, ...(session ? { session } : {}) },
  );
  if (updated) return updated;

  const existing = await DigitalAssetClaim.findOne({ assetIdentifierNormalized }, null, findOpts);
  if (
    existing
    && existing.status === ASSET_CLAIM_STATUS.CLAIMED
    && existing.product
    && String(existing.product) !== String(productId)
  ) {
    throw duplicateAssetError({ productId: existing.product });
  }

  try {
    if (session) {
      const [created] = await DigitalAssetClaim.create([fields], { session });
      return created;
    }
    return DigitalAssetClaim.create(fields);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw duplicateAssetError({ assetIdentifierNormalized });
    }
    throw error;
  }
}

export async function releaseDigitalAssetClaim(
  productId,
  { session = null } = {},
) {
  if (!productId) return { modifiedCount: 0 };

  return DigitalAssetClaim.updateMany(
    { product: productId, status: ASSET_CLAIM_STATUS.CLAIMED },
    {
      $set: {
        status: ASSET_CLAIM_STATUS.RELEASED,
        releasedAt: new Date(),
      },
    },
    session ? { session } : undefined,
  );
}

/**
 * Sync claim state with the product's current identifier + status.
 */
export async function syncProductAssetClaim(product, { session = null } = {}) {
  const blocking = isBlockingProductStatus(product.status, {
    deletedAt: product.deletedAt,
  });

  if (!product.assetIdentifierNormalized || !blocking) {
    await releaseDigitalAssetClaim(product._id, { session });
    return null;
  }

  await assertAssetAvailable(product.assetIdentifierNormalized, {
    excludeProductId: product._id,
    session,
  });

  return claimDigitalAsset({
    productId: product._id,
    sellerId: product.seller || null,
    assetIdentifier: product.assetIdentifier,
    assetIdentifierNormalized: product.assetIdentifierNormalized,
    assetPlatform: product.assetPlatform,
    productType: product.productType,
    session,
  });
}

export function wrapDuplicateAssetError(error) {
  if (error instanceof AppError && error.code === ASSET_DUPLICATE_CODE) {
    return error;
  }
  if (isDuplicateKeyError(error)) {
    return duplicateAssetError({
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
    });
  }
  return error;
}

export default {
  prepareAssetFields,
  assertAssetAvailable,
  claimDigitalAsset,
  releaseDigitalAssetClaim,
  syncProductAssetClaim,
  wrapDuplicateAssetError,
  duplicateAssetError,
};
