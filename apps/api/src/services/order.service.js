import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../utils/transaction.js';
import { addHours } from '../helpers/date.helper.js';
import { roundMoney } from '../helpers/money.helper.js';
import {
  generateOrderNumber,
  generatePaymentOrderId,
  isDuplicateKeyError,
  duplicateKeyFields,
} from '../helpers/id.helper.js';
import {
  normalizeCryptomusNetwork,
  networksEqual,
} from '../helpers/cryptomusAssets.helper.js';
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  DELIVERY_STATUS,
} from '../constants/statuses.js';
import {
  PRODUCT_STATUS,
  APPROVAL_STATUS,
  STOCK_TYPES,
  DELIVERY_TYPES,
} from '../constants/productTypes.js';
import { LEDGER_CURRENCY } from '../constants/currencies.js';
import {
  Product,
  SellerProfile,
  Order,
  Payment,
  Escrow,
} from '../models/index.js';
import * as orderRepository from '../repositories/order.repository.js';
import * as paymentRepository from '../repositories/payment.repository.js';
import * as escrowRepository from '../repositories/escrow.repository.js';
import * as commissionService from './commission.service.js';
import * as cryptomusService from './cryptomus.service.js';
import * as escrowService from './escrow.service.js';
import { getPlatformConfig } from './config.service.js';
import { logActivity } from './activity.service.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { USER_ROLES } from '../constants/roles.js';
import { emitDomainEvent } from '../events/bus.js';
import { DOMAIN_EVENTS } from '../constants/events.js';
import { sha256Hex } from '../utils/crypto.js';
import { logger } from '../config/logger.js';

const CHECKOUT_CREATE_ATTEMPTS = 3;
const INVOICE_WAIT_TIMEOUT_MS = 25_000;
const INVOICE_WAIT_INTERVAL_MS = 400;

function isStaff(actor) {
  return actor?.roles?.some((r) => [
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.SUPPORT,
  ].includes(r));
}

function checkoutConflictError(error) {
  const fields = duplicateKeyFields(error);
  return new AppError(
    'A checkout session could not be created due to a conflict. Please try again.',
    409,
    {
      code: 'CHECKOUT_CONFLICT',
      details: fields.length ? { fields } : undefined,
    },
  );
}

async function restockLimitedProduct(productId, quantity, session = null) {
  const qty = Math.max(1, Number(quantity) || 1);
  let productQuery = Product.findById(productId);
  if (session) productQuery = productQuery.session(session);
  const product = await productQuery;
  if (!product || product.stockType !== STOCK_TYPES.LIMITED) return;
  product.stock += qty;
  if (product.status === PRODUCT_STATUS.OUT_OF_STOCK) {
    product.status = PRODUCT_STATUS.LIVE;
  }
  if (session) await product.save({ session });
  else await product.save();
}

function buildCheckoutFingerprint({
  buyerId,
  productId,
  quantity,
  toCurrency,
  network,
}) {
  return sha256Hex([
    String(buyerId),
    String(productId),
    String(Math.max(1, Number(quantity) || 1)),
    String(toCurrency || '').toUpperCase(),
    String(normalizeCryptomusNetwork(network) || '').toUpperCase(),
    'cryptomus',
  ].join('|'));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadCheckoutBundle(paymentDoc) {
  if (!paymentDoc) return null;
  const payment = paymentDoc.toObject ? paymentDoc.toObject() : paymentDoc;
  const order = await orderRepository.findOrderById(payment.order, { lean: true });
  if (!order) return null;
  if ([ORDER_STATUS.COMPLETED, ORDER_STATUS.ESCROW, ORDER_STATUS.PAID].includes(order.status)
    && payment.status === PAYMENT_STATUS.PAID) {
    const escrow = await Escrow.findOne({ order: order._id }).lean();
    return {
      order,
      payment,
      escrow,
      reused: true,
      cryptomusOrderId: payment.cryptomusOrderId,
      alreadyCompleted: true,
    };
  }
  const escrow = await Escrow.findOne({ order: order._id }).lean();
  return {
    order,
    payment,
    escrow,
    reused: true,
    cryptomusOrderId: payment.cryptomusOrderId,
  };
}

async function waitForPaymentInvoice(paymentId, {
  timeoutMs = INVOICE_WAIT_TIMEOUT_MS,
  intervalMs = INVOICE_WAIT_INTERVAL_MS,
} = {}) {
  const started = Date.now();
  let latest = await paymentRepository.findPaymentById(paymentId, { lean: true });
  while (Date.now() - started < timeoutMs) {
    if (!latest) return null;
    if (latest.invoiceUrl) return latest;
    if (latest.isFinal || [
      PAYMENT_STATUS.FAILED,
      PAYMENT_STATUS.CANCELLED,
      PAYMENT_STATUS.EXPIRED,
      PAYMENT_STATUS.PAID,
    ].includes(latest.status)) {
      return latest;
    }
    await sleep(intervalMs);
    latest = await paymentRepository.findPaymentById(paymentId, { lean: true });
  }
  return latest;
}

/**
 * Attach / recover a Cryptomus invoice for an existing local Payment.
 * Never creates a second local order — reuses cryptomusOrderId.
 */
async function ensureCryptomusInvoiceForPayment({
  payment,
  order,
  amount,
  currency,
  network,
  toCurrency,
  lifetimeSeconds,
  urlCallback,
  urlReturn,
  urlSuccess,
}) {
  let fresh = await paymentRepository.findPaymentById(payment._id);
  if (!fresh) {
    throw new AppError('Payment not found', 404, { code: 'PAYMENT_NOT_FOUND' });
  }
  if (fresh.invoiceUrl) {
    return { payment: fresh, invoice: fresh.rawInvoice || { url: fresh.invoiceUrl, uuid: fresh.cryptomusUuid }, simulated: Boolean(fresh.metadata?.simulated), reused: true };
  }

  // Provider may already have created the invoice while a prior response was lost.
  if (cryptomusService.isCryptomusConfigured() && fresh.cryptomusOrderId) {
    try {
      const info = await cryptomusService.getPaymentInfo({
        uuid: fresh.cryptomusUuid || undefined,
        orderId: fresh.cryptomusOrderId,
      });
      if (info && (info.url || info.uuid || info.address)) {
        const invoiceUpdate = {
          invoiceUrl: info.url || fresh.invoiceUrl || null,
          address: info.address || fresh.address || null,
          providerStatus: info.payment_status || info.status || fresh.providerStatus,
          rawInvoice: info,
        };
        if (info.uuid) invoiceUpdate.cryptomusUuid = info.uuid;
        fresh = await paymentRepository.updatePaymentById(fresh._id, invoiceUpdate);
        return { payment: fresh, invoice: info, simulated: false, reused: true };
      }
    } catch (error) {
      logger.info('Cryptomus payment info lookup before invoice create', {
        paymentId: String(fresh._id),
        error: error.message,
      });
    }
  }

  let invoice;
  let simulated = false;
  try {
    const created = await cryptomusService.createInvoiceOrSimulate({
      amount,
      currency,
      orderId: fresh.cryptomusOrderId,
      network,
      toCurrency,
      lifetime: lifetimeSeconds,
      urlCallback,
      urlReturn,
      urlSuccess,
      additionalData: String(order._id),
    });
    invoice = created.invoice;
    simulated = created.simulated;
  } catch (error) {
    // Ambiguous failure: another worker may have created the invoice — re-check.
    const raced = await waitForPaymentInvoice(fresh._id, { timeoutMs: 5_000 });
    if (raced?.invoiceUrl) {
      return {
        payment: raced,
        invoice: raced.rawInvoice || { url: raced.invoiceUrl, uuid: raced.cryptomusUuid },
        simulated: Boolean(raced.metadata?.simulated),
        reused: true,
      };
    }
    if (cryptomusService.isCryptomusConfigured()) {
      try {
        const info = await cryptomusService.getPaymentInfo({
          orderId: fresh.cryptomusOrderId,
          uuid: fresh.cryptomusUuid || undefined,
        });
        if (info && (info.url || info.uuid)) {
          const invoiceUpdate = {
            invoiceUrl: info.url || null,
            address: info.address || null,
            providerStatus: info.payment_status || info.status || 'check',
            rawInvoice: info,
          };
          if (info.uuid) invoiceUpdate.cryptomusUuid = info.uuid;
          fresh = await paymentRepository.updatePaymentById(fresh._id, invoiceUpdate);
          return { payment: fresh, invoice: info, simulated: false, reused: true };
        }
      } catch {
        // fall through to mark failed
      }
    }
    await orderRepository.updateOrderById(order._id, {
      status: ORDER_STATUS.CANCELLED,
      cancelledAt: new Date(),
      cancelledReason: 'Payment invoice creation failed',
    });
    await paymentRepository.updatePaymentById(fresh._id, {
      $set: {
        status: PAYMENT_STATUS.FAILED,
        failureReason: error.message,
        isFinal: true,
      },
      $unset: { checkoutFingerprint: 1 },
    });
    throw error;
  }

  const invoiceUpdate = {
    invoiceUrl: invoice.url || null,
    address: invoice.address || null,
    providerStatus: invoice.payment_status || 'check',
    rawInvoice: invoice,
    metadata: { ...(fresh.metadata || {}), simulated },
  };
  if (invoice.uuid) invoiceUpdate.cryptomusUuid = invoice.uuid;

  try {
    fresh = await paymentRepository.updatePaymentById(fresh._id, invoiceUpdate);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const existing = await paymentRepository.findPaymentById(fresh._id, { lean: true });
      if (existing?.invoiceUrl) {
        return {
          payment: existing,
          invoice: existing.rawInvoice || { url: existing.invoiceUrl, uuid: existing.cryptomusUuid },
          simulated: Boolean(existing.metadata?.simulated),
          reused: true,
        };
      }
      throw checkoutConflictError(error);
    }
    throw error;
  }

  return { payment: fresh, invoice, simulated, reused: false };
}

/**
 * Find an unpaid Cryptomus checkout for the same buyer + product + qty + asset route.
 * Includes in-flight invoices (invoiceUrl still null) so concurrent clicks coalesce.
 */
async function findReusableCryptomusCheckout({
  buyerId,
  productId,
  quantity,
  toCurrency,
  network,
  checkoutFingerprint = null,
  requireInvoiceUrl = false,
}) {
  const now = new Date();
  if (checkoutFingerprint) {
    const byFingerprint = await paymentRepository.findActivePaymentByFingerprint(
      checkoutFingerprint,
      { lean: true },
    );
    if (byFingerprint) {
      const bundle = await loadCheckoutBundle(byFingerprint);
      if (bundle && (!requireInvoiceUrl || bundle.payment.invoiceUrl)) {
        return bundle;
      }
    }
  }

  const pendingOrders = await Order.find({
    buyer: buyerId,
    product: productId,
    quantity: Math.max(1, Number(quantity) || 1),
    status: {
      $in: [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAYMENT_PROCESSING],
    },
    expiresAt: { $gt: now },
  })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  const wantCurrency = toCurrency ? String(toCurrency).toUpperCase() : null;
  const wantNetwork = normalizeCryptomusNetwork(network);

  for (const order of pendingOrders) {
    const payment = await Payment.findOne({
      order: order._id,
      buyer: buyerId,
      gateway: 'cryptomus',
      status: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING] },
      expiresAt: { $gt: now },
      isFinal: { $ne: true },
      ...(requireInvoiceUrl ? { invoiceUrl: { $nin: [null, ''] } } : {}),
    }).lean();

    if (!payment) continue;

    const payCurrency = payment.toCurrency
      ? String(payment.toCurrency).toUpperCase()
      : null;
    if (wantCurrency && payCurrency && wantCurrency !== payCurrency) continue;
    if (wantNetwork && payment.network && !networksEqual(wantNetwork, payment.network)) {
      continue;
    }

    const escrow = await Escrow.findOne({ order: order._id }).lean();
    return {
      order,
      payment,
      escrow,
      reused: true,
      cryptomusOrderId: payment.cryptomusOrderId,
    };
  }

  return null;
}

async function resolveExistingCheckout(bundle, {
  amount,
  currency,
  network,
  toCurrency,
  lifetimeSeconds,
  urlCallback,
  urlReturn,
  urlSuccess,
}) {
  if (!bundle) return null;
  if (bundle.alreadyCompleted) {
    return buildBuyNowResponse({
      order: bundle.order,
      payment: bundle.payment,
      escrow: bundle.escrow,
      paymentUrl: bundle.payment.invoiceUrl || null,
      cryptomusOrderId: bundle.cryptomusOrderId,
      simulated: Boolean(bundle.payment?.metadata?.simulated),
      reused: true,
    });
  }

  if (bundle.payment.invoiceUrl) {
    return buildBuyNowResponse({
      order: bundle.order,
      payment: bundle.payment,
      escrow: bundle.escrow,
      paymentUrl: bundle.payment.invoiceUrl,
      cryptomusOrderId: bundle.cryptomusOrderId,
      simulated: Boolean(bundle.payment?.metadata?.simulated),
      reused: true,
    });
  }

  // Another request may be creating the invoice — wait briefly first.
  const waited = await waitForPaymentInvoice(bundle.payment._id, { timeoutMs: 8_000 });
  if (waited?.invoiceUrl) {
    const refreshed = await loadCheckoutBundle(waited);
    return buildBuyNowResponse({
      order: refreshed.order,
      payment: refreshed.payment,
      escrow: refreshed.escrow,
      paymentUrl: refreshed.payment.invoiceUrl,
      cryptomusOrderId: refreshed.cryptomusOrderId,
      simulated: Boolean(refreshed.payment?.metadata?.simulated),
      reused: true,
    });
  }

  const ensured = await ensureCryptomusInvoiceForPayment({
    payment: bundle.payment,
    order: bundle.order,
    amount,
    currency,
    network,
    toCurrency,
    lifetimeSeconds,
    urlCallback,
    urlReturn,
    urlSuccess,
  });

  const order = await orderRepository.findOrderById(bundle.order._id, { lean: true });
  const escrow = await Escrow.findOne({ order: bundle.order._id }).lean();
  const payment = ensured.payment.toObject ? ensured.payment.toObject() : ensured.payment;

  return buildBuyNowResponse({
    order,
    payment,
    escrow,
    paymentUrl: ensured.invoice?.url || payment.invoiceUrl,
    cryptomusOrderId: payment.cryptomusOrderId,
    simulated: ensured.simulated,
    reused: true,
  });
}

/**
 * Cancel other unpaid checkouts for this buyer/product so stock and unique
 * commerce rows stay consistent when a new invoice is required.
 * Never cancels the checkout we are keeping (same fingerprint / order).
 */
async function abandonUnpaidCheckoutsForProduct({
  buyerId,
  productId,
  keepOrderId = null,
  keepFingerprint = null,
  reason = 'Superseded by a new checkout attempt',
}) {
  const pendingOrders = await Order.find({
    buyer: buyerId,
    product: productId,
    status: { $in: [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAYMENT_PROCESSING] },
    ...(keepOrderId ? { _id: { $ne: keepOrderId } } : {}),
  }).limit(20);

  for (const order of pendingOrders) {
    try {
      await withTransaction(async (session) => {
        const fresh = await orderRepository.findOrderById(order._id, { session });
        if (!fresh || ![ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAYMENT_PROCESSING].includes(fresh.status)) {
          return;
        }

        const payment = await paymentRepository.findPaymentByOrder(fresh._id, { session });
        if (payment?.checkoutFingerprint && keepFingerprint
          && payment.checkoutFingerprint === keepFingerprint) {
          return;
        }
        if (payment && payment.status === PAYMENT_STATUS.PAID) return;

        fresh.status = ORDER_STATUS.CANCELLED;
        fresh.cancelledAt = new Date();
        fresh.cancelledReason = reason;
        await fresh.save({ session });

        if (payment && payment.status !== PAYMENT_STATUS.PAID) {
          payment.status = PAYMENT_STATUS.CANCELLED;
          payment.isFinal = true;
          payment.failureReason = reason;
          payment.checkoutFingerprint = undefined;
          await payment.save({ session });
        }

        await restockLimitedProduct(fresh.product, fresh.quantity, session);
      });
    } catch {
      // Best-effort cleanup — checkout creation still proceeds.
    }
  }
}

function buildBuyNowResponse({
  order,
  payment,
  escrow,
  paymentUrl,
  cryptomusOrderId,
  simulated = false,
  reused = false,
}) {
  return {
    order,
    payment,
    escrow,
    paymentUrl,
    reused,
    cryptomus: {
      uuid: payment?.cryptomusUuid || null,
      orderId: cryptomusOrderId,
      simulated,
      mode: cryptomusService.getCryptomusMode(),
    },
  };
}

/**
 * BUY NOW — one order = one product.
 * Product purchases are wallet-only. Cryptomus is for wallet deposits only.
 */
export async function buyNow(payload, actor, requestMeta = {}) {
  if (!actor?.roles?.includes(USER_ROLES.BUYER) && !isStaff(actor)) {
    throw new AppError('Only buyers can purchase products', 403, { code: 'FORBIDDEN' });
  }

  if (payload.paymentMethod && payload.paymentMethod !== 'wallet') {
    throw new AppError(
      'Product purchases must be paid from your Buyer Wallet. Deposit via Cryptomus on the Wallet page, then checkout.',
      400,
      { code: 'WALLET_ONLY_CHECKOUT' },
    );
  }

  const productId = payload.productId;
  const product = await Product.findById(productId);
  if (!product || product.deletedAt) {
    throw new AppError('Product not found', 404, { code: 'PRODUCT_NOT_FOUND' });
  }

  if (
    product.status !== PRODUCT_STATUS.LIVE
    || product.approvalStatus !== APPROVAL_STATUS.APPROVED
  ) {
    throw new AppError('Product is not available for purchase', 400, {
      code: 'PRODUCT_NOT_AVAILABLE',
    });
  }

  if (!product.seller) {
    throw new AppError('Product has no seller', 400, { code: 'PRODUCT_NO_SELLER' });
  }

  const seller = await SellerProfile.findById(product.seller);
  if (!seller || seller.status !== 'approved') {
    throw new AppError('Seller is not available', 400, { code: 'SELLER_UNAVAILABLE' });
  }

  if (String(seller.user) === String(actor.id)) {
    throw new AppError('You cannot buy your own product', 400, { code: 'SELF_PURCHASE' });
  }

  const quantity = Math.max(1, Math.min(500, Number(payload.quantity) || 1));

  if (product.stockType === STOCK_TYPES.LIMITED && product.stock < quantity) {
    throw new AppError('Product is out of stock', 400, { code: 'OUT_OF_STOCK' });
  }

  // Instant Access: require enough unsold inventory rows (reservation happens after payment).
  if (product.deliveryType === DELIVERY_TYPES.AUTOMATIC) {
    const { countAvailableInventory } = await import('./inventory.service.js');
    const availableInventory = await countAvailableInventory(product._id);
    if (availableInventory < quantity) {
      throw new AppError('Product is out of stock', 400, {
        code: 'OUT_OF_STOCK',
        details: { availableInventory },
      });
    }
  }

  const unitPrice = roundMoney(product.price);
  if (!(unitPrice > 0)) {
    throw new AppError('Product price is invalid', 400, { code: 'INVALID_PRICE' });
  }

  const subtotal = roundMoney(unitPrice * quantity);
  const commission = await commissionService.computeOrderCommission(subtotal, {
    sellerId: seller._id,
    categoryId: product.category,
  });

  return buyNowWithWallet({
    actor,
    product,
    seller,
    quantity,
    unitPrice,
    subtotal,
    commission,
    requestMeta,
  });
}

/**
 * Buy Now paid entirely from buyer wallet balance (Cryptomus-funded prepaid).
 */
async function buyNowWithWallet({
  actor,
  product,
  seller,
  quantity,
  unitPrice,
  subtotal,
  commission,
  requestMeta,
}) {
  const buyerWalletService = await import('./buyerWallet.service.js');
  const walletPreview = await buyerWalletService.getMyWallet(actor);
  if (walletPreview.frozen) {
    throw new AppError('Wallet is frozen. Contact support or deposit after unfreeze.', 403, {
      code: 'WALLET_FROZEN',
    });
  }
  if (walletPreview.availableBalance + 1e-9 < subtotal) {
    throw new AppError(
      `Insufficient wallet balance. Available $${walletPreview.availableBalance.toFixed(2)}, required $${subtotal.toFixed(2)}. Please deposit or top up.`,
      400,
      {
        code: 'INSUFFICIENT_WALLET_BALANCE',
        details: {
          availableBalance: walletPreview.availableBalance,
          required: subtotal,
        },
      },
    );
  }

  const orderNumber = generateOrderNumber();
  const walletPaymentId = generatePaymentOrderId(`wallet_${orderNumber}`);
  const paidAt = new Date();

  const result = await withTransaction(async (session) => {
    if (product.stockType === STOCK_TYPES.LIMITED) {
      const updateOpts = { new: true };
      if (session) updateOpts.session = session;
      const updated = await Product.findOneAndUpdate(
        {
          _id: product._id,
          stock: { $gte: quantity },
          status: PRODUCT_STATUS.LIVE,
          deletedAt: null,
        },
        { $inc: { stock: -quantity } },
        updateOpts,
      );
      if (!updated) {
        throw new AppError('Product is out of stock', 400, { code: 'OUT_OF_STOCK' });
      }
      if (updated.stock === 0) {
        updated.status = PRODUCT_STATUS.OUT_OF_STOCK;
        if (session) await updated.save({ session });
        else await updated.save();
      }
    }

    const accounts = Array.from({ length: quantity }, (_, index) => ({
      index,
      identifier: `${orderNumber}-ACC-${index + 1}`,
      status: 'active',
      label: `Account ${index + 1}`,
    }));

    const order = await orderRepository.createOrder(
      {
        orderNumber,
        buyer: actor.id,
        seller: seller._id,
        sellerUser: seller.user,
        product: product._id,
        productSnapshot: {
          title: product.title,
          slug: product.slug,
          price: unitPrice,
          currency: product.currency || LEDGER_CURRENCY,
          productType: product.productType,
          thumbnail: product.thumbnail,
          deliveryType: product.deliveryType,
        },
        quantity,
        accounts,
        unitPrice,
        subtotal,
        commissionPercent: commission.percent,
        commissionAmount: commission.commissionAmount,
        sellerAmount: commission.sellerAmount,
        totalAmount: subtotal,
        currency: product.currency || LEDGER_CURRENCY,
        status: ORDER_STATUS.PAID,
        deliveryStatus: DELIVERY_STATUS.PENDING,
        paidAt,
        metadata: { paymentMethod: 'wallet' },
      },
      session,
    );

    const payment = await paymentRepository.createPayment(
      {
        order: order._id,
        orderNumber,
        buyer: actor.id,
        seller: seller._id,
        gateway: 'wallet',
        amount: subtotal,
        currency: order.currency,
        status: PAYMENT_STATUS.PAID,
        cryptomusOrderId: walletPaymentId,
        invoiceUrl: null,
        paidAt,
        isFinal: true,
        providerStatus: 'wallet_paid',
        metadata: { paymentMethod: 'wallet' },
      },
      session,
    );

    order.payment = payment._id;
    if (session) await order.save({ session });
    else await order.save();

    await buyerWalletService.spendForOrder({
      buyerId: actor.id,
      amount: subtotal,
      orderId: order._id,
      paymentId: payment._id,
      session,
      createdBy: actor.id,
      description: `Purchase ${orderNumber} from wallet`,
    });

    const escrow = await escrowService.createPendingEscrow({
      order,
      payment,
      session,
    });
    order.escrow = escrow._id;
    if (session) await order.save({ session });
    else await order.save();

    await escrowService.lockEscrowAfterPayment({
      orderId: order._id,
      paymentId: payment._id,
      actorId: actor.id,
      session,
      source: 'wallet',
    });

    await logActivity({
      userId: actor.id,
      action: 'orders.buy_now_wallet',
      resource: 'Order',
      resourceId: order._id,
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      meta: {
        productId: product._id,
        amount: subtotal,
        quantity,
        paymentMethod: 'wallet',
      },
      session,
    });

    return { order, payment, escrow };
  });

  const response = {
    order: (await orderRepository.findOrderById(result.order._id, { lean: true })),
    payment: await paymentRepository.findPaymentById(result.payment._id, { lean: true }),
    escrow: (await escrowRepository.findEscrowById(result.escrow._id, { lean: true })),
    paymentUrl: null,
    paymentMethod: 'wallet',
    wallet: await (await import('./buyerWallet.service.js')).getMyWallet(actor),
  };

  emitDomainEvent(DOMAIN_EVENTS.ORDER_CREATED, {
    order: response.order,
    payment: response.payment,
  });
  emitDomainEvent(DOMAIN_EVENTS.PAYMENT_SUCCESS, {
    order: response.order,
    payment: response.payment,
  });

  try {
    const { trackPromotionEvent } = await import('./storePromotion.service.js');
    await trackPromotionEvent(seller._id, 'ordersGenerated');
  } catch {
    /* analytics must not block checkout */
  }

  return response;
}

export async function getOrder(idOrNumber, actor) {
  let order = null;
  if (/^[a-fA-F0-9]{24}$/.test(idOrNumber)) {
    order = await Order.findById(idOrNumber)
      .populate('payment')
      .populate('escrow')
      .populate('dispute')
      .populate('product', 'title slug thumbnail price status')
      .lean();
  }
  if (!order) {
    order = await Order.findOne({ orderNumber: idOrNumber })
      .populate('payment')
      .populate('escrow')
      .populate('dispute')
      .populate('product', 'title slug thumbnail price status')
      .lean();
  }
  if (!order) {
    throw new AppError('Order not found', 404, { code: 'ORDER_NOT_FOUND' });
  }

  assertOrderAccess(order, actor);
  return order;
}

function assertOrderAccess(order, actor) {
  if (!actor) {
    throw new AppError('Unauthorized', 401, { code: 'UNAUTHORIZED' });
  }
  if (isStaff(actor)) return;
  if (String(order.buyer) === String(actor.id)) return;
  if (String(order.sellerUser) === String(actor.id)) return;
  throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
}

export async function listOrders(query = {}, actor) {
  const pagination = parsePagination(query);
  const filter = {};

  if (isStaff(actor)) {
    if (query.buyerId) filter.buyer = query.buyerId;
    if (query.sellerId) filter.seller = query.sellerId;
    if (query.status) filter.status = query.status;
  } else if (query.scope === 'seller' || actor.roles?.includes(USER_ROLES.SELLER)) {
    if (query.scope === 'seller' || (!query.scope && actor.roles?.includes(USER_ROLES.SELLER) && !actor.roles?.includes(USER_ROLES.BUYER))) {
      const seller = await SellerProfile.findOne({ user: actor.id }).lean();
      if (!seller) {
        throw new AppError('Seller profile not found', 404, { code: 'SELLER_NOT_FOUND' });
      }
      filter.seller = seller._id;
      if (query.status) filter.status = query.status;
    } else {
      filter.buyer = actor.id;
      if (query.status) filter.status = query.status;
    }
  } else {
    filter.buyer = actor.id;
    if (query.status) filter.status = query.status;
  }

  if (query.productId) filter.product = query.productId;

  const { items, total } = await orderRepository.listOrders(filter, {
    ...pagination,
    populate: [
      { path: 'payment', select: 'status invoiceUrl providerStatus paidAt cryptomusUuid' },
      { path: 'escrow', select: 'status releaseAt lockedAt releasedAt' },
      { path: 'product', select: 'title slug thumbnail' },
    ],
  });

  return { items, meta: buildPaginationMeta({ ...pagination, total }) };
}

export async function cancelOrder(orderId, actor, reason = 'Cancelled by user') {
  return withTransaction(async (session) => {
    const order = await orderRepository.findOrderById(orderId, { session });
    if (!order) {
      throw new AppError('Order not found', 404, { code: 'ORDER_NOT_FOUND' });
    }
    assertOrderAccess(order, actor);

    if (![ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAYMENT_PROCESSING].includes(order.status)) {
      throw new AppError('Only unpaid orders can be cancelled', 400, {
        code: 'ORDER_NOT_CANCELLABLE',
      });
    }

    order.status = ORDER_STATUS.CANCELLED;
    order.cancelledAt = new Date();
    order.cancelledReason = reason;
    if (session) await order.save({ session });
    else await order.save();

    const payment = await paymentRepository.findPaymentByOrder(order._id, { session });
    if (payment && payment.status !== PAYMENT_STATUS.PAID) {
      payment.status = PAYMENT_STATUS.CANCELLED;
      payment.isFinal = true;
      if (session) await payment.save({ session });
      else await payment.save();
    }

    await restockLimitedProduct(order.product, order.quantity, session);

    await logActivity({
      userId: actor.id,
      action: 'orders.cancelled',
      resource: 'Order',
      resourceId: order._id,
      meta: { reason },
      session,
    });

    return order.toObject();
  });
}

export async function expireOrders({ limit = 100 } = {}) {
  const due = await orderRepository.findExpiredPendingOrders(new Date(), limit);
  const results = { processed: 0, succeeded: 0, failed: 0 };

  for (const item of due) {
    results.processed += 1;
    try {
      await withTransaction(async (session) => {
        const order = await orderRepository.findOrderById(item._id, { session });
        if (!order) return;
        if (![ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAYMENT_PROCESSING].includes(order.status)) {
          return;
        }
        if (order.expiresAt && order.expiresAt > new Date()) return;

        order.status = ORDER_STATUS.EXPIRED;
        order.cancelledReason = 'Payment window expired';
        if (session) await order.save({ session });
        else await order.save();

        const payment = await paymentRepository.findPaymentByOrder(order._id, { session });
        if (payment && payment.status !== PAYMENT_STATUS.PAID) {
          payment.status = PAYMENT_STATUS.EXPIRED;
          payment.isFinal = true;
          if (session) await payment.save({ session });
          else await payment.save();
        }

        await restockLimitedProduct(order.product, order.quantity, session);
      });
      results.succeeded += 1;
    } catch {
      results.failed += 1;
    }
  }

  return results;
}

export default {
  buyNow,
  getOrder,
  listOrders,
  cancelOrder,
  expireOrders,
};
