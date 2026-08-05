import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeOrderDeliveryActions,
  enrichOrderWithDeliveryActions,
  resolveOrderDeliveryType,
} from '../../src/helpers/orderDeliveryActions.helper.js';

const seller = { id: 'seller-1', roles: ['seller'] };
const buyer = { id: 'buyer-1', roles: ['buyer'] };

function manualEscrowOrder(overrides = {}) {
  return {
    sellerUser: 'seller-1',
    status: 'escrow',
    deliveryStatus: 'awaiting_delivery',
    paidAt: '2026-08-04T00:00:00.000Z',
    escrowedAt: '2026-08-04T00:00:01.000Z',
    productSnapshot: { deliveryType: 'manual', title: 'Manual Pack' },
    payment: { status: 'paid' },
    escrow: { status: 'locked' },
    ...overrides,
  };
}

describe('orderDeliveryActions', () => {
  it('resolves deliveryType from snapshot then product', () => {
    assert.equal(
      resolveOrderDeliveryType({ productSnapshot: { deliveryType: 'manual' } }),
      'manual',
    );
    assert.equal(
      resolveOrderDeliveryType({
        product: { deliveryType: 'automatic' },
      }),
      'automatic',
    );
  });

  it('allows Deliver for seller on paid manual escrow awaiting delivery', () => {
    const result = computeOrderDeliveryActions(manualEscrowOrder(), seller);
    assert.equal(result.canDeliver, true);
    assert.equal(result.availableActions.deliver, true);
    assert.equal(result.deliveryType, 'manual');
  });

  it('denies Deliver for buyer, automatic products, and terminal states', () => {
    assert.equal(
      computeOrderDeliveryActions(manualEscrowOrder(), buyer).canDeliver,
      false,
    );
    assert.equal(
      computeOrderDeliveryActions(
        manualEscrowOrder({ productSnapshot: { deliveryType: 'automatic' } }),
        seller,
      ).canDeliver,
      false,
    );
    assert.equal(
      computeOrderDeliveryActions(
        manualEscrowOrder({ deliveryStatus: 'delivered', status: 'delivered' }),
        seller,
      ).canDeliver,
      false,
    );
    assert.equal(
      computeOrderDeliveryActions(
        manualEscrowOrder({ status: 'completed' }),
        seller,
      ).canDeliver,
      false,
    );
    assert.equal(
      computeOrderDeliveryActions(
        manualEscrowOrder({ status: 'cancelled' }),
        seller,
      ).canDeliver,
      false,
    );
    assert.equal(
      computeOrderDeliveryActions(
        manualEscrowOrder({ status: 'refunded' }),
        seller,
      ).canDeliver,
      false,
    );
  });

  it('requires payment paid and escrow present', () => {
    assert.equal(
      computeOrderDeliveryActions(
        manualEscrowOrder({
          paidAt: null,
          payment: { status: 'pending' },
          status: 'pending_payment',
          escrow: null,
          escrowedAt: null,
        }),
        seller,
      ).canDeliver,
      false,
    );
  });

  it('enriches lean order payloads with flags', () => {
    const enriched = enrichOrderWithDeliveryActions(manualEscrowOrder(), seller);
    assert.equal(enriched.canDeliver, true);
    assert.equal(enriched.availableActions.deliver, true);
    assert.equal(enriched.deliveryType, 'manual');
  });
});
