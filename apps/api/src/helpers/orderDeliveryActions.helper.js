import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  DELIVERY_STATUS,
} from '../constants/statuses.js';
import { DELIVERY_TYPES } from '../constants/productTypes.js';
import { USER_ROLES } from '../constants/roles.js';

function isStaff(actor) {
  return actor?.roles?.some((r) => [
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.SUPPORT,
  ].includes(r));
}

/**
 * Resolve product.deliveryType from snapshot, populated product, or order field.
 */
export function resolveOrderDeliveryType(order) {
  if (!order) return null;
  const snap = order.productSnapshot?.deliveryType || null;
  if (snap) return snap;
  const product = typeof order.product === 'object' && order.product
    ? order.product
    : null;
  return product?.deliveryType || order.deliveryType || null;
}

function isManualDeliveryType(deliveryType) {
  return deliveryType === DELIVERY_TYPES.MANUAL || deliveryType === 'handover';
}

function isPaymentPaid(order) {
  const payment = typeof order.payment === 'object' && order.payment
    ? order.payment
    : null;
  if (payment?.status === PAYMENT_STATUS.PAID) return true;
  if (order.paidAt) return true;
  return [
    ORDER_STATUS.PAID,
    ORDER_STATUS.ESCROW,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.DISPUTED,
  ].includes(order.status);
}

function escrowExists(order) {
  const escrow = typeof order.escrow === 'object' && order.escrow
    ? order.escrow
    : null;
  if (escrow) return true;
  if (order.escrowedAt) return true;
  return [
    ORDER_STATUS.ESCROW,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.DISPUTED,
  ].includes(order.status);
}

function sellerOwnsOrder(order, actor) {
  if (!actor || !order) return false;
  if (isStaff(actor)) return true;
  return String(order.sellerUser) === String(actor.id);
}

/**
 * Deliver Order eligibility for MANUAL products after payment + escrow.
 * Exposed to sellers (and staff) via canDeliver / availableActions.deliver.
 */
export function computeOrderDeliveryActions(order, actor) {
  const deliveryType = resolveOrderDeliveryType(order);
  const canDeliver = Boolean(
    sellerOwnsOrder(order, actor)
    && isManualDeliveryType(deliveryType)
    && isPaymentPaid(order)
    && escrowExists(order)
    && order.deliveryStatus !== DELIVERY_STATUS.DELIVERED
    && ![
      ORDER_STATUS.DELIVERED,
      ORDER_STATUS.COMPLETED,
      ORDER_STATUS.CANCELLED,
      ORDER_STATUS.EXPIRED,
      ORDER_STATUS.REFUNDED,
      ORDER_STATUS.DISPUTED,
    ].includes(order.status)
    && [ORDER_STATUS.ESCROW, ORDER_STATUS.PAID].includes(order.status),
  );

  return {
    deliveryType,
    canDeliver,
    availableActions: {
      deliver: canDeliver,
    },
  };
}

/**
 * Attach delivery action flags onto a lean order document for API responses.
 */
export function enrichOrderWithDeliveryActions(order, actor) {
  if (!order) return order;
  const actions = computeOrderDeliveryActions(order, actor);
  return {
    ...order,
    deliveryType: actions.deliveryType,
    canDeliver: actions.canDeliver,
    availableActions: actions.availableActions,
  };
}

export default {
  resolveOrderDeliveryType,
  computeOrderDeliveryActions,
  enrichOrderWithDeliveryActions,
};
