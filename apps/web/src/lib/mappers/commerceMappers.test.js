import { describe, expect, it } from 'vitest';
import {
  buildOrderTimeline,
  mapBackendEscrow,
  mapBackendOrder,
  mapBackendPayment,
  mapBackendWallet,
  mapBackendWithdrawal,
} from './commerceMappers';
import { estimateCommission, formatMoney } from '../../constants/commerce';

describe('commerceMappers', () => {
  it('maps backend orders with payment, escrow, and timeline', () => {
    const order = mapBackendOrder({
      _id: 'o1',
      orderNumber: 'HS-1001',
      status: 'escrow',
      quantity: 2,
      unitPrice: 25,
      subtotal: 50,
      totalAmount: 50,
      commissionPercent: 10,
      commissionAmount: 5,
      sellerAmount: 45,
      createdAt: '2026-07-01T00:00:00.000Z',
      paidAt: '2026-07-01T00:05:00.000Z',
      escrowedAt: '2026-07-01T00:05:01.000Z',
      productSnapshot: {
        title: 'Premium Account',
        thumbnail: '/a.jpg',
        productType: 'account',
        deliveryType: 'manual',
      },
      deliveryStatus: 'awaiting_delivery',
      seller: { storeName: 'Acme Shop', slug: 'acme' },
      payment: {
        _id: 'pay1',
        status: 'paid',
        invoiceUrl: 'https://pay.example/inv',
        paidAt: '2026-07-01T00:05:00.000Z',
      },
      escrow: {
        _id: 'esc1',
        status: 'locked',
        lockedAt: '2026-07-01T00:05:01.000Z',
        releaseAt: '2026-07-02T00:05:01.000Z',
      },
    });

    expect(order.id).toBe('HS-1001');
    expect(order.amount).toBe(50);
    expect(order.paymentStatus).toBe('paid');
    expect(order.escrowStatus).toBe('locked');
    expect(order.product.title).toBe('Premium Account');
    expect(order.product.artist).toBe('Acme Shop');
    expect(order.product.deliveryType).toBe('manual');
    expect(order.deliveryType).toBe('manual');
    expect(order.deliveryStatus).toBe('awaiting_delivery');
    expect(order.deliveryStatusLabel).toBe('Awaiting Delivery');
    expect(order.canDeliver).toBe(true);
    expect(order.timeline.some((step) => step.key === 'payment_verified' && step.done)).toBe(true);
    expect(order.timeline.some((step) => step.key === 'escrow_created' && step.done)).toBe(true);
  });

  it('maps wallet, payment, escrow, and withdrawal records', () => {
    expect(mapBackendWallet({
      _id: 'w1',
      availableBalance: 12.345,
      pendingBalance: 4,
      releasedBalance: 20,
      withdrawableBalance: 12.34,
      totalWithdrawn: 8,
    }).availableBalance).toBe(12.35);

    expect(mapBackendPayment({
      _id: 'p1',
      amount: 99,
      status: 'pending',
      toCurrency: 'USDT',
      network: 'TRC20',
    }).statusLabel).toBe('Pending');

    expect(mapBackendEscrow({
      _id: 'e1',
      amount: 100,
      sellerAmount: 90,
      commissionAmount: 10,
      status: 'released',
      order: { orderNumber: 'HS-9', productSnapshot: { title: 'Item' } },
    }).productTitle).toBe('Item');

    expect(mapBackendWithdrawal({
      _id: 'wd1',
      amount: 50,
      coin: 'USDT',
      network: 'TRC20',
      walletAddress: 'Txyz',
      status: 'pending',
    }).statusLabel).toBe('Pending');
  });

  it('builds refund and dispute timeline markers', () => {
    const steps = buildOrderTimeline(
      { status: 'disputed', createdAt: '2026-07-01T00:00:00.000Z' },
      { status: 'paid' },
      { status: 'disputed', disputedAt: '2026-07-02T00:00:00.000Z' },
    );
    expect(steps.some((s) => s.key === 'dispute' && s.done)).toBe(true);
  });
});

describe('commerce helpers', () => {
  it('formats money and estimates commission display totals', () => {
    expect(formatMoney(10.126)).toBe(10.13);
    const fee = estimateCommission(100, 10);
    expect(fee.commissionAmount).toBe(10);
    expect(fee.sellerAmount).toBe(90);
    expect(fee.totalAmount).toBe(100);
  });
});
