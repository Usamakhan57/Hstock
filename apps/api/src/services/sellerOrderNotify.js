import { DELIVERY_TYPES } from '../constants/productTypes.js';

/**
 * Build seller "New Order Received" copy for Telegram / in-app.
 * Pure helper — safe to unit test without DB.
 */
export function buildSellerNewOrderMessage(order = {}, buyer = null) {
  const product = order.productSnapshot?.title
    || order.product?.title
    || 'Product';
  const buyerLabel = buyer?.name
    || buyer?.email
    || order.buyerEmail
    || order.buyerName
    || 'Buyer';
  const orderNumber = order.orderNumber || '—';
  const qty = Number(order.quantity || 1);
  const amount = Number(order.totalAmount ?? order.subtotal ?? 0);
  const deliveryType = order.productSnapshot?.deliveryType
    || order.deliveryType
    || null;
  const delivery = deliveryType === DELIVERY_TYPES.AUTOMATIC
    || deliveryType === 'automatic'
    || deliveryType === 'instant'
    ? 'Instant Access'
    : 'Manual';

  const title = '🛒 New Order Received';
  const body = [
    `Product: ${product}`,
    `Buyer: ${buyerLabel}`,
    `Order: ${orderNumber}`,
    `Quantity: ${qty}`,
    `Amount: $${amount.toFixed(2)}`,
    `Delivery: ${delivery}`,
    '',
    'Open Seller Dashboard to manage the order.',
  ].join('\n');

  return {
    title,
    body,
    link: '/seller/orders',
    meta: {
      orderId: order._id ? String(order._id) : null,
      orderNumber,
      quantity: qty,
      amount,
      delivery,
    },
  };
}

export default { buildSellerNewOrderMessage };
