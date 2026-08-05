/** Delivery-type helpers for the seller product creation flow. */

export const DELIVERY_TYPE = Object.freeze({
  INSTANT: 'automatic',
  MANUAL: 'manual',
});

export const DELIVERY_OPTIONS = Object.freeze([
  { value: DELIVERY_TYPE.INSTANT, label: 'Instant Access' },
  { value: DELIVERY_TYPE.MANUAL, label: 'Manual Delivery' },
]);

export function isManualDelivery(deliveryType) {
  return deliveryType === 'manual' || deliveryType === 'handover';
}

export function isInstantAccess(deliveryType) {
  return !isManualDelivery(deliveryType);
}

/** Instant Access listings require imported inventory before publish. */
export function isInventoryRequired(deliveryType) {
  return isInstantAccess(deliveryType);
}

export function countReadyInventory(accounts = []) {
  if (!Array.isArray(accounts)) return 0;
  return accounts.filter((account) => {
    const status = String(account?.status || '').toLowerCase();
    return status === 'uploaded' || status === 'valid' || status === 'ready';
  }).length;
}

export function getDeliveryLabel(deliveryType) {
  return isManualDelivery(deliveryType) ? 'Manual Delivery' : 'Instant Access';
}

/**
 * Seller may deliver when the order is a paid/escrowed MANUAL product
 * that has not been delivered, cancelled, refunded, or completed.
 */
export function canSellerDeliverOrder(order) {
  if (!order) return false;
  if (order.canDeliver === true) return true;
  if (order.canDeliver === false) return false;

  const deliveryType = order.product?.deliveryType || order.deliveryType;
  if (!isManualDelivery(deliveryType)) return false;

  const status = String(order.status || '').toLowerCase();
  if (['cancelled', 'expired', 'refunded', 'completed', 'disputed'].includes(status)) {
    return false;
  }
  if (!['escrow', 'paid'].includes(status)) return false;

  const deliveryStatus = String(order.deliveryStatus || '').toLowerCase();
  if (deliveryStatus === 'delivered') return false;

  return true;
}

export default {
  DELIVERY_TYPE,
  DELIVERY_OPTIONS,
  isManualDelivery,
  isInstantAccess,
  isInventoryRequired,
  countReadyInventory,
  getDeliveryLabel,
  canSellerDeliverOrder,
};
