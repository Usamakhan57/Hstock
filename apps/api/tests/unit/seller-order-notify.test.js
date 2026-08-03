import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildSellerNewOrderMessage } from '../../src/services/sellerOrderNotify.js';

describe('buildSellerNewOrderMessage', () => {
  it('formats Instant Access orders for seller Telegram', () => {
    const msg = buildSellerNewOrderMessage(
      {
        _id: 'abc',
        orderNumber: 'ORD-1001',
        quantity: 2,
        totalAmount: 19.5,
        productSnapshot: { title: 'Gmail Account', deliveryType: 'automatic' },
      },
      { name: 'Ada Buyer', email: 'ada@example.com' },
    );

    assert.equal(msg.title, '🛒 New Order Received');
    assert.match(msg.body, /Product: Gmail Account/);
    assert.match(msg.body, /Buyer: Ada Buyer/);
    assert.match(msg.body, /Order: ORD-1001/);
    assert.match(msg.body, /Quantity: 2/);
    assert.match(msg.body, /Amount: \$19\.50/);
    assert.match(msg.body, /Delivery: Instant Access/);
    assert.match(msg.body, /Open Seller Dashboard to manage the order\./);
    assert.equal(msg.link, '/seller/orders');
  });

  it('labels manual delivery and falls back to buyer email', () => {
    const msg = buildSellerNewOrderMessage(
      {
        orderNumber: 'ORD-2',
        quantity: 1,
        totalAmount: 5,
        productSnapshot: { title: 'Steam Key', deliveryType: 'manual' },
      },
      { email: 'buyer@example.com' },
    );

    assert.match(msg.body, /Buyer: buyer@example.com/);
    assert.match(msg.body, /Delivery: Manual/);
  });
});
