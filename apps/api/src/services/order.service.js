import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../utils/transaction.js';
import { addHours } from '../helpers/date.helper.js';
import { roundMoney } from '../helpers/money.helper.js';
import {
  generateOrderNumber,
  generatePaymentOrderId,
} from '../helpers/id.helper.js';
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  DELIVERY_STATUS,
} from '../constants/statuses.js';
import {
  PRODUCT_STATUS,
  APPROVAL_STATUS,
  STOCK_TYPES,
} from '../constants/productTypes.js';
import { LEDGER_CURRENCY } from '../constants/currencies.js';
import {
  Product,
  SellerProfile,
  Order,
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

function isStaff(actor) {
  return actor?.roles?.some((r) => [
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.SUPPORT,
  ].includes(r));
}

/**
 * BUY NOW — one order = one product.
 * paymentMethod: cryptomus (default invoice) | wallet (prepaid balance funded by Cryptomus).
 */
export async function buyNow(payload, actor, requestMeta = {}) {
  if (!actor?.roles?.includes(USER_ROLES.BUYER) && !isStaff(actor)) {
    throw new AppError('Only buyers can purchase products', 403, { code: 'FORBIDDEN' });
  }

  const paymentMethod = payload.paymentMethod === 'wallet' ? 'wallet' : 'cryptomus';

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

  const unitPrice = roundMoney(product.price);
  if (!(unitPrice > 0)) {
    throw new AppError('Product price is invalid', 400, { code: 'INVALID_PRICE' });
  }

  const subtotal = roundMoney(unitPrice * quantity);
  const commission = await commissionService.computeOrderCommission(subtotal, {
    sellerId: seller._id,
    categoryId: product.category,
  });

  if (paymentMethod === 'wallet') {
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

  const platform = await getPlatformConfig();
  const lifetimeSeconds = platform?.orderPaymentLifetimeSeconds || 3600;
  const orderNumber = generateOrderNumber();
  const cryptomusOrderId = generatePaymentOrderId(orderNumber);
  const expiresAt = addHours(new Date(), lifetimeSeconds / 3600);

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
        status: ORDER_STATUS.PENDING_PAYMENT,
        deliveryStatus: DELIVERY_STATUS.PENDING,
        expiresAt,
        metadata: {
          toCurrency: payload.toCurrency || null,
          network: payload.network || null,
        },
      },
      session,
    );

    const payment = await paymentRepository.createPayment(
      {
        order: order._id,
        orderNumber,
        buyer: actor.id,
        seller: seller._id,
        gateway: 'cryptomus',
        amount: subtotal,
        currency: order.currency,
        toCurrency: payload.toCurrency || null,
        network: payload.network || null,
        status: PAYMENT_STATUS.PENDING,
        cryptomusUuid: null,
        cryptomusOrderId,
        invoiceUrl: null,
        lifetimeSeconds,
        expiresAt,
        providerStatus: 'created',
        metadata: {},
      },
      session,
    );

    order.payment = payment._id;
    if (session) await order.save({ session });
    else await order.save();

    const escrow = await escrowService.createPendingEscrow({
      order,
      payment,
      session,
    });
    order.escrow = escrow._id;
    if (session) await order.save({ session });
    else await order.save();

    await logActivity({
      userId: actor.id,
      action: 'orders.buy_now',
      resource: 'Order',
      resourceId: order._id,
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      meta: {
        productId: product._id,
        amount: subtotal,
        quantity,
        cryptomusOrderId,
      },
      session,
    });

    return { order, payment, escrow };
  });

  const callbackUrl = cryptomusService.buildCallbackUrl();
  const successBase = payload.urlSuccess || undefined;
  const urlSuccess = successBase
    ? `${successBase}${successBase.includes('?') ? '&' : '?'}order=${encodeURIComponent(orderNumber)}`
    : undefined;
  let invoice;
  let simulated = false;
  try {
    const created = await cryptomusService.createInvoiceOrSimulate({
      amount: subtotal,
      currency: result.order.currency,
      orderId: cryptomusOrderId,
      network: payload.network || null,
      toCurrency: payload.toCurrency || null,
      lifetime: lifetimeSeconds,
      urlCallback: callbackUrl,
      urlReturn: payload.urlReturn || undefined,
      urlSuccess,
      additionalData: String(result.order._id),
    });
    invoice = created.invoice;
    simulated = created.simulated;
  } catch (error) {
    await orderRepository.updateOrderById(result.order._id, {
      status: ORDER_STATUS.CANCELLED,
      cancelledAt: new Date(),
      cancelledReason: 'Payment invoice creation failed',
    });
    await paymentRepository.updatePaymentById(result.payment._id, {
      status: PAYMENT_STATUS.FAILED,
      failureReason: error.message,
      isFinal: true,
    });
    throw error;
  }

  const payment = await paymentRepository.updatePaymentById(result.payment._id, {
    cryptomusUuid: invoice.uuid || null,
    invoiceUrl: invoice.url || null,
    address: invoice.address || null,
    providerStatus: invoice.payment_status || 'check',
    rawInvoice: invoice,
    metadata: { simulated },
  });

  const response = {
    order: (await orderRepository.findOrderById(result.order._id, { lean: true })),
    payment: payment.toObject ? payment.toObject() : payment,
    escrow: (await escrowRepository.findEscrowById(result.escrow._id, { lean: true })),
    paymentUrl: invoice.url,
    cryptomus: {
      uuid: invoice.uuid,
      orderId: cryptomusOrderId,
      simulated,
      mode: cryptomusService.getCryptomusMode(),
    },
  };

  emitDomainEvent(DOMAIN_EVENTS.ORDER_CREATED, {
    order: response.order,
    payment: response.payment,
  });

  return response;
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
    throw new AppError('Wallet is frozen. Contact support or pay with Cryptomus.', 403, {
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
  const walletPaymentId = `wallet_${String(orderNumber).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
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
        cryptomusUuid: null,
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

    // Restock
        let productQuery = Product.findById(order.product);
    if (session) productQuery = productQuery.session(session);
    const product = await productQuery;
    if (product && product.stockType === STOCK_TYPES.LIMITED) {
      product.stock += 1;
      if (product.status === PRODUCT_STATUS.OUT_OF_STOCK) {
        product.status = PRODUCT_STATUS.LIVE;
      }
      if (session) await product.save({ session });
      else await product.save();
    }

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

        let productQuery = Product.findById(order.product);
        if (session) productQuery = productQuery.session(session);
        const product = await productQuery;
        if (product && product.stockType === STOCK_TYPES.LIMITED) {
          product.stock += 1;
          if (product.status === PRODUCT_STATUS.OUT_OF_STOCK) {
            product.status = PRODUCT_STATUS.LIVE;
          }
          if (session) await product.save({ session });
          else await product.save();
        }
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
