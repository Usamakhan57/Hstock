import { describe, expect, it } from 'vitest';
import {
  countReadyInventory,
  getDeliveryLabel,
  isInstantAccess,
  isInventoryRequired,
  isManualDelivery,
  canSellerDeliverOrder,
} from './sellerDelivery';

describe('sellerDelivery', () => {
  it('treats manual/handover as Manual Delivery', () => {
    expect(isManualDelivery('manual')).toBe(true);
    expect(isManualDelivery('handover')).toBe(true);
    expect(isManualDelivery('automatic')).toBe(false);
    expect(isInstantAccess('automatic')).toBe(true);
    expect(isInstantAccess('instant')).toBe(true);
  });

  it('requires inventory only for Instant Access', () => {
    expect(isInventoryRequired('manual')).toBe(false);
    expect(isInventoryRequired('handover')).toBe(false);
    expect(isInventoryRequired('automatic')).toBe(true);
    expect(isInventoryRequired('instant')).toBe(true);
  });

  it('counts ready inventory rows', () => {
    expect(countReadyInventory([
      { status: 'uploaded' },
      { status: 'failed' },
      { status: 'ready' },
      { status: 'pending' },
    ])).toBe(2);
  });

  it('returns buyer-facing delivery labels', () => {
    expect(getDeliveryLabel('manual')).toBe('Manual Delivery');
    expect(getDeliveryLabel('automatic')).toBe('Instant Access');
  });

  it('exposes Deliver Order only for unpaid-safe manual escrow orders', () => {
    expect(canSellerDeliverOrder({
      status: 'escrow',
      deliveryStatus: 'awaiting_delivery',
      product: { deliveryType: 'manual' },
    })).toBe(true);

    expect(canSellerDeliverOrder({
      status: 'escrow',
      deliveryStatus: 'awaiting_delivery',
      product: { deliveryType: 'automatic' },
    })).toBe(false);

    expect(canSellerDeliverOrder({
      status: 'escrow',
      deliveryStatus: 'delivered',
      product: { deliveryType: 'manual' },
    })).toBe(false);

    expect(canSellerDeliverOrder({
      status: 'cancelled',
      deliveryStatus: 'awaiting_delivery',
      product: { deliveryType: 'manual' },
    })).toBe(false);

    expect(canSellerDeliverOrder({
      canDeliver: true,
      status: 'pending_payment',
      product: { deliveryType: 'automatic' },
    })).toBe(true);
  });
});
