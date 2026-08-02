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

export default {
  DELIVERY_TYPE,
  DELIVERY_OPTIONS,
  isManualDelivery,
  isInstantAccess,
  isInventoryRequired,
  countReadyInventory,
  getDeliveryLabel,
};
