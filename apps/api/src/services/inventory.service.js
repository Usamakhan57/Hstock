import crypto from 'node:crypto';
import {
  Product,
  ProductInventoryItem,
  SellerProfile,
  OrderDelivery,
} from '../models/index.js';
import {
  INVENTORY_ITEM_STATUS,
  INVENTORY_SOURCE_FORMATS,
} from '../models/ProductInventoryItem.model.js';
import { AppError } from '../utils/AppError.js';
import {
  encryptCredential,
  decryptCredential,
  maskCredential,
} from '../utils/credentials.crypto.js';
import { withTransaction } from '../utils/transaction.js';
import { USER_ROLES } from '../constants/roles.js';
import { DELIVERY_TYPES, PRODUCT_STATUS, STOCK_TYPES } from '../constants/productTypes.js';
import { DELIVERY_STATUS, ORDER_STATUS } from '../constants/statuses.js';
import { logActivity } from './activity.service.js';
import { emitDomainEvent } from '../events/bus.js';
import { DOMAIN_EVENTS } from '../constants/events.js';

const FIELD_ALIASES = Object.freeze({
  email: 'email',
  username: 'username',
  password: 'password',
  recovery: 'recovery',
  recoveryemail: 'recovery',
  recoverycode: 'recovery',
  '2fa': '2fa',
  twofa: '2fa',
  otp: '2fa',
  cookie: 'cookie',
  token: 'token',
  licensekey: 'licenseKey',
  license: 'licenseKey',
  apikey: 'apiKey',
  note: 'note',
  notes: 'note',
});

function isStaff(actor) {
  return actor?.roles?.some((role) =>
    [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(role));
}

async function resolveSellerForUser(actor) {
  return SellerProfile.findOne({ user: actor.id || actor._id });
}

async function assertCanManageProduct(product, actor) {
  if (!product || product.deletedAt) {
    throw new AppError('Product not found', 404, { code: 'PRODUCT_NOT_FOUND' });
  }
  if (isStaff(actor)) return product;
  const seller = await resolveSellerForUser(actor);
  if (!seller || String(product.seller) !== String(seller._id)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }
  return product;
}

function normalizeFields(rawFields = {}) {
  const fields = {};
  for (const [rawKey, rawValue] of Object.entries(rawFields || {})) {
    if (rawValue === undefined || rawValue === null) continue;
    // Preserve credential text exactly (newlines, commas, blank lines, etc.).
    const value = String(rawValue);
    if (value === '') continue;
    const alias = FIELD_ALIASES[String(rawKey).trim().toLowerCase()] || String(rawKey).trim();
    fields[alias] = value;
  }
  return fields;
}

function fingerprintForFields(fields) {
  const email = String(fields.email || fields.username || '').trim().toLowerCase();
  const password = String(fields.password || '').trim();
  const token = String(fields.token || fields.apiKey || fields.licenseKey || '').trim();
  const basis = email || token || JSON.stringify(fields);
  return crypto
    .createHash('sha256')
    .update(`${basis}|${password}|${token}`)
    .digest('hex');
}

function maskFields(fields = {}) {
  const masked = {};
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'email' || key === 'username') {
      masked[key] = maskCredential(value, { visible: 3 });
    } else if (key === 'note') {
      masked[key] = value.length > 24 ? `${value.slice(0, 24)}…` : value;
    } else {
      masked[key] = maskCredential(value, { visible: 0 });
    }
  }
  return masked;
}

function encryptFields(fields = {}) {
  return encryptCredential(JSON.stringify(fields));
}

function decryptFields(payload) {
  const json = decryptCredential(payload);
  if (!json) return {};
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function pendingPaymentQuantity(productId, session = null) {
  const { Order } = await import('../models/index.js');
  const { ORDER_STATUS } = await import('../constants/statuses.js');
  const pipeline = [
    {
      $match: {
        product: productId,
        status: {
          $in: [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAYMENT_PROCESSING],
        },
      },
    },
    { $group: { _id: null, qty: { $sum: '$quantity' } } },
  ];
  const rows = session
    ? await Order.aggregate(pipeline).session(session)
    : await Order.aggregate(pipeline);
  return Number(rows[0]?.qty || 0);
}

async function syncProductStockFromInventory(productId, session = null) {
  const available = await ProductInventoryItem.countDocuments({
    product: productId,
    status: INVENTORY_ITEM_STATUS.AVAILABLE,
  }).session(session || null);
  const pendingQty = await pendingPaymentQuantity(productId, session);
  const sellable = Math.max(0, available - pendingQty);

  const product = session
    ? await Product.findById(productId).session(session)
    : await Product.findById(productId);
  if (!product) return available;

  product.stock = sellable;
  product.stockType = STOCK_TYPES.LIMITED;
  if (sellable === 0 && product.status === PRODUCT_STATUS.LIVE) {
    product.status = PRODUCT_STATUS.OUT_OF_STOCK;
  } else if (sellable > 0 && product.status === PRODUCT_STATUS.OUT_OF_STOCK) {
    product.status = PRODUCT_STATUS.LIVE;
  }
  if (session) await product.save({ session });
  else await product.save();
  return available;
}

export async function countAvailableInventory(productId, session = null) {
  return ProductInventoryItem.countDocuments({
    product: productId,
    status: INVENTORY_ITEM_STATUS.AVAILABLE,
  }).session(session || null);
}

/**
 * Replace available Instant Access inventory for a product.
 * Sold/reserved rows are preserved. Stock is synced to available count.
 */
export async function replaceProductInventory(productId, payload, actor) {
  const product = await Product.findById(productId);
  await assertCanManageProduct(product, actor);

  if (product.deliveryType === DELIVERY_TYPES.MANUAL) {
    throw new AppError('Manual Delivery products do not use Instant Access inventory', 400, {
      code: 'INVENTORY_NOT_APPLICABLE',
    });
  }

  const accounts = Array.isArray(payload?.accounts) ? payload.accounts : [];
  const sourceFormat = INVENTORY_SOURCE_FORMATS[String(payload?.sourceFormat || 'paste').toUpperCase()]
    || payload?.sourceFormat
    || INVENTORY_SOURCE_FORMATS.PASTE;

  const prepared = [];
  const seenFingerprints = new Set();
  const seenEmails = new Set();

  for (const row of accounts) {
    const fields = normalizeFields(row.fields || row);
    if (!Object.keys(fields).length) continue;
    const emailNormalized = fields.email
      ? String(fields.email).trim().toLowerCase()
      : null;
    if (emailNormalized && !emailNormalized.includes('@')) {
      throw new AppError(`Invalid email in inventory: ${fields.email}`, 400, {
        code: 'INVENTORY_INVALID_EMAIL',
      });
    }
    const fingerprint = fingerprintForFields(fields);
    if (seenFingerprints.has(fingerprint)) continue;
    if (emailNormalized && seenEmails.has(emailNormalized)) {
      throw new AppError(`Duplicate email in import: ${emailNormalized}`, 400, {
        code: 'INVENTORY_DUPLICATE_EMAIL',
      });
    }
    seenFingerprints.add(fingerprint);
    if (emailNormalized) seenEmails.add(emailNormalized);
    prepared.push({
      fields,
      emailNormalized,
      fingerprint,
      fieldKeys: Object.keys(fields),
      credentialsEncrypted: encryptFields(fields),
      credentialsMasked: maskFields(fields),
    });
  }

  if (!prepared.length) {
    throw new AppError('At least one valid inventory account is required', 400, {
      code: 'INVENTORY_EMPTY',
    });
  }

  const mode = payload?.mode === 'append' ? 'append' : 'replace_available';

  const result = await withTransaction(async (session) => {
    if (mode === 'replace_available') {
      await ProductInventoryItem.deleteMany(
        {
          product: product._id,
          status: INVENTORY_ITEM_STATUS.AVAILABLE,
        },
        session ? { session } : undefined,
      );
    }

    const docs = prepared.map((item) => ({
      product: product._id,
      seller: product.seller,
      status: INVENTORY_ITEM_STATUS.AVAILABLE,
      sourceFormat,
      emailNormalized: item.emailNormalized,
      fingerprint: item.fingerprint,
      credentialsEncrypted: item.credentialsEncrypted,
      credentialsMasked: item.credentialsMasked,
      fieldKeys: item.fieldKeys,
    }));

    try {
      if (session) {
        await ProductInventoryItem.insertMany(docs, { session, ordered: true });
      } else {
        await ProductInventoryItem.insertMany(docs, { ordered: true });
      }
    } catch (error) {
      if (error?.code === 11000) {
        throw new AppError('Inventory contains accounts that already exist for this product', 409, {
          code: 'INVENTORY_DUPLICATE',
        });
      }
      throw error;
    }

    const available = await syncProductStockFromInventory(product._id, session);

    await logActivity({
      userId: actor.id,
      action: 'inventory.replaced',
      resource: 'Product',
      resourceId: product._id,
      meta: {
        mode,
        imported: prepared.length,
        available,
        sourceFormat,
      },
      session,
    });

    return { imported: prepared.length, available, mode, sourceFormat };
  });

  return result;
}

export async function listProductInventory(productId, actor, { includeSold = false } = {}) {
  const product = await Product.findById(productId).lean();
  await assertCanManageProduct(product, actor);

  const filter = { product: productId };
  if (!includeSold) {
    filter.status = {
      $in: [INVENTORY_ITEM_STATUS.AVAILABLE, INVENTORY_ITEM_STATUS.RESERVED],
    };
  }

  const [items, counts] = await Promise.all([
    ProductInventoryItem.find(filter)
      .select('-credentialsEncrypted')
      .sort({ createdAt: 1 })
      .limit(2000)
      .lean(),
    ProductInventoryItem.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const summary = {
    available: 0,
    reserved: 0,
    sold: 0,
    invalid: 0,
    total: 0,
  };
  for (const row of counts) {
    summary[row._id] = row.count;
    summary.total += row.count;
  }

  return {
    productId: String(product._id),
    deliveryType: product.deliveryType,
    stock: product.stock,
    summary,
    items: items.map((item) => ({
      id: String(item._id),
      status: item.status,
      sourceFormat: item.sourceFormat,
      emailNormalized: item.emailNormalized,
      credentialsMasked: item.credentialsMasked || {},
      fieldKeys: item.fieldKeys || [],
      order: item.order ? String(item.order) : null,
      createdAt: item.createdAt,
      soldAt: item.soldAt,
    })),
  };
}

/**
 * Atomically reserve N available inventory items for an order and create delivery.
 * Idempotent when OrderDelivery already exists.
 */
export async function fulfillInstantAccessOrder(order, { session = null } = {}) {
  if (!order) return null;

  const deliveryType = order.productSnapshot?.deliveryType || null;
  if (deliveryType && deliveryType !== DELIVERY_TYPES.AUTOMATIC) {
    return null;
  }

  const existing = session
    ? await OrderDelivery.findOne({ order: order._id }).session(session)
    : await OrderDelivery.findOne({ order: order._id });
  if (existing) {
    if (order.deliveryStatus !== DELIVERY_STATUS.DELIVERED) {
      order.deliveryStatus = DELIVERY_STATUS.DELIVERED;
      order.deliveredAt = order.deliveredAt || existing.deliveredAt || new Date();
      if (order.status === ORDER_STATUS.ESCROW || order.status === ORDER_STATUS.PAID) {
        // Keep order.status in escrow until release; delivery is independent.
      }
      if (session) await order.save({ session });
      else await order.save();
    }
    return existing;
  }

  // Resolve deliveryType from product when snapshot missing (legacy orders).
  const product = session
    ? await Product.findById(order.product).session(session)
    : await Product.findById(order.product);
  if (!product) {
    throw new AppError('Product not found for Instant Access fulfillment', 404, {
      code: 'PRODUCT_NOT_FOUND',
    });
  }
  if (product.deliveryType === DELIVERY_TYPES.MANUAL) {
    return null;
  }

  const quantity = Math.max(1, Number(order.quantity || 1));
  const reserved = [];

  for (let i = 0; i < quantity; i += 1) {
    const opts = {
      new: true,
      sort: { createdAt: 1 },
    };
    if (session) opts.session = session;

    // eslint-disable-next-line no-await-in-loop
    const claimed = await ProductInventoryItem.findOneAndUpdate(
      {
        product: order.product,
        status: INVENTORY_ITEM_STATUS.AVAILABLE,
      },
      {
        $set: {
          status: INVENTORY_ITEM_STATUS.SOLD,
          order: order._id,
          reservedAt: new Date(),
          soldAt: new Date(),
        },
      },
      opts,
    );

    if (!claimed) {
      if (reserved.length) {
        // eslint-disable-next-line no-await-in-loop
        await ProductInventoryItem.updateMany(
          { _id: { $in: reserved.map((row) => row._id) } },
          {
            $set: {
              status: INVENTORY_ITEM_STATUS.AVAILABLE,
              order: null,
              reservedAt: null,
              soldAt: null,
            },
          },
          session ? { session } : undefined,
        );
      }
      throw new AppError('Insufficient Instant Access inventory to fulfill order', 409, {
        code: 'INVENTORY_UNAVAILABLE',
        details: { needed: quantity, reserved: reserved.length },
      });
    }

    // eslint-disable-next-line no-await-in-loop
    const item = session
      ? await ProductInventoryItem.findById(claimed._id).select('+credentialsEncrypted').session(session)
      : await ProductInventoryItem.findById(claimed._id).select('+credentialsEncrypted');

    if (!item?.credentialsEncrypted) {
      if (reserved.length || claimed) {
        const rollbackIds = [...reserved.map((row) => row._id), claimed._id];
        // eslint-disable-next-line no-await-in-loop
        await ProductInventoryItem.updateMany(
          { _id: { $in: rollbackIds } },
          {
            $set: {
              status: INVENTORY_ITEM_STATUS.AVAILABLE,
              order: null,
              reservedAt: null,
              soldAt: null,
            },
          },
          session ? { session } : undefined,
        );
      }
      throw new AppError('Inventory item credentials missing', 500, {
        code: 'INVENTORY_CORRUPT',
      });
    }

    reserved.push(item);
  }

  const deliveredAccounts = reserved.map((item, index) => {
    const fields = decryptFields(item.credentialsEncrypted);
    return {
      index,
      inventoryItem: item._id,
      label: fields.email || fields.username || `Account ${index + 1}`,
      credentialsEncrypted: encryptFields(fields),
      credentialsMasked: maskFields(fields),
      fieldKeys: Object.keys(fields),
    };
  });

  const deliveryDoc = {
    order: order._id,
    product: order.product,
    buyer: order.buyer,
    seller: order.seller,
    deliveryType: DELIVERY_TYPES.AUTOMATIC,
    sourceFormat: reserved[0]?.sourceFormat || INVENTORY_SOURCE_FORMATS.PASTE,
    accounts: deliveredAccounts,
    accountCount: deliveredAccounts.length,
    deliveredAt: new Date(),
  };

  let delivery;
  try {
    if (session) {
      const created = await OrderDelivery.create([deliveryDoc], { session });
      delivery = created[0];
    } else {
      delivery = await OrderDelivery.create(deliveryDoc);
    }
  } catch (error) {
    if (error?.code === 11000) {
      // Concurrent fulfill won the race — reuse existing
      delivery = session
        ? await OrderDelivery.findOne({ order: order._id }).session(session)
        : await OrderDelivery.findOne({ order: order._id });
    } else {
      throw error;
    }
  }

  // Enrich order.accounts identifiers with delivered emails (no secrets).
  if (Array.isArray(order.accounts) && order.accounts.length) {
    order.accounts = order.accounts.map((account, index) => {
      const delivered = deliveredAccounts[index];
      if (!delivered) return account;
      return {
        ...(account.toObject ? account.toObject() : account),
        identifier: delivered.label || account.identifier,
        label: delivered.label || account.label,
      };
    });
  } else {
    order.accounts = deliveredAccounts.map((account) => ({
      index: account.index,
      identifier: account.label,
      label: account.label,
      status: 'active',
    }));
  }

  order.deliveryStatus = DELIVERY_STATUS.DELIVERED;
  order.deliveredAt = delivery.deliveredAt || new Date();
  order.metadata = {
    ...(order.metadata || {}),
    instantAccessDelivered: true,
    instantAccessDeliveryId: String(delivery._id),
  };

  if (session) await order.save({ session });
  else await order.save();

  await syncProductStockFromInventory(order.product, session);

  await logActivity({
    userId: null,
    action: 'orders.instant_access_delivered',
    resource: 'Order',
    resourceId: order._id,
    meta: {
      productId: order.product,
      accountCount: deliveredAccounts.length,
      deliveryId: delivery._id,
    },
    session,
  });

  const orderObj = order.toObject ? order.toObject() : order;
  emitDomainEvent(DOMAIN_EVENTS.ORDER_DELIVERED, {
    order: orderObj,
    deliveryType: DELIVERY_TYPES.AUTOMATIC,
  });

  return delivery;
}

export async function getOrderDeliveryForBuyer(orderId, actor) {
  const { Order } = await import('../models/index.js');
  let order = null;
  if (/^[a-fA-F0-9]{24}$/.test(orderId)) {
    order = await Order.findById(orderId).lean();
  }
  if (!order) {
    order = await Order.findOne({ orderNumber: orderId }).lean();
  }
  if (!order) {
    throw new AppError('Order not found', 404, { code: 'ORDER_NOT_FOUND' });
  }

  const buyerId = String(order.buyer);
  const isBuyer = String(actor.id) === buyerId;
  const isSeller = String(order.sellerUser) === String(actor.id);
  if (!isBuyer && !isSeller && !isStaff(actor)) {
    throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
  }

  const delivery = await OrderDelivery.findOne({ order: order._id })
    .select('+accounts.credentialsEncrypted')
    .lean();

  if (!delivery) {
    return {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      deliveryStatus: order.deliveryStatus,
      delivered: false,
      accounts: [],
      downloads: { txt: false, csv: false, zip: false },
    };
  }

  const accounts = (delivery.accounts || []).map((account) => {
    const fields = decryptFields(account.credentialsEncrypted);
    return {
      id: String(account._id),
      index: account.index,
      label: account.label || fields.email || `Account ${(account.index ?? 0) + 1}`,
      fields,
      fieldKeys: account.fieldKeys?.length ? account.fieldKeys : Object.keys(fields),
      masked: account.credentialsMasked || {},
    };
  });

  return {
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    productId: String(delivery.product),
    deliveryStatus: order.deliveryStatus,
    orderStatus: order.status,
    escrowIndependent: true,
    delivered: true,
    deliveredAt: delivery.deliveredAt,
    sourceFormat: delivery.sourceFormat,
    accountCount: accounts.length,
    accounts,
    downloads: {
      txt: true,
      csv: true,
      zip: true,
    },
  };
}

export {
  decryptFields,
  encryptFields,
  normalizeFields,
  maskFields,
  syncProductStockFromInventory,
};

export default {
  replaceProductInventory,
  listProductInventory,
  fulfillInstantAccessOrder,
  getOrderDeliveryForBuyer,
};
