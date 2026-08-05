import { describe, expect, it } from 'vitest';
import {
  buildSalesChart,
  buildBestSelling,
  buildLowestStock,
  buildMostViewed,
  buildTopCategories,
  buildActionRequired,
  summarizeSellerStats,
} from './sellerAnalytics';

describe('sellerAnalytics', () => {
  const orders = [
    {
      id: '1',
      status: 'completed',
      amount: 40,
      sellerAmount: 36,
      quantity: 2,
      date: new Date().toISOString(),
      buyer: { email: 'a@x.com' },
      product: { id: 'p1', title: 'Pack A', cat: 'Instagram', img: '' },
    },
    {
      id: '2',
      status: 'disputed',
      amount: 20,
      sellerAmount: 18,
      quantity: 1,
      date: new Date().toISOString(),
      buyer: { email: 'a@x.com' },
      product: { id: 'p1', title: 'Pack A', cat: 'Instagram', img: '' },
      disputeOpen: true,
    },
    {
      id: '3',
      status: 'cancelled',
      amount: 10,
      quantity: 1,
      date: new Date().toISOString(),
      buyer: { email: 'b@y.com' },
      product: { id: 'p2', title: 'Pack B', cat: 'TikTok', img: '' },
    },
  ];

  const products = [
    {
      id: 'p1',
      title: 'Pack A',
      status: 'live',
      stock: 0,
      stockType: 'limited',
      deliveryType: 'automatic',
      metrics: { views: 120, revenue: 80 },
      soldCount: 3,
      thumbnail: '',
    },
    {
      id: 'p2',
      title: 'Pack B',
      status: 'draft',
      stock: 12,
      stockType: 'limited',
      deliveryType: 'manual',
      metrics: { views: 10, revenue: 0 },
      soldCount: 0,
      thumbnail: '',
    },
  ];

  it('builds a sales chart with revenue for recent days', () => {
    const chart = buildSalesChart(orders, 7);
    expect(chart).toHaveLength(7);
    const today = chart[chart.length - 1];
    expect(today.sales).toBeGreaterThan(0);
    expect(today.orders).toBe(2);
  });

  it('aggregates best selling and categories from live orders', () => {
    const best = buildBestSelling(orders, [], 5);
    expect(best[0].id).toBe('p1');
    expect(best[0].sales).toBe(3);

    const cats = buildTopCategories(orders, [], 5);
    expect(cats[0].name).toBe('Instagram');
  });

  it('builds lowest stock and most viewed lists', () => {
    const lowest = buildLowestStock(products, 5);
    expect(lowest[0].id).toBe('p1');
    expect(lowest[0].stock).toBe(0);

    const viewed = buildMostViewed(products, 5);
    expect(viewed[0].id).toBe('p1');
    expect(viewed[0].views).toBe(120);
  });

  it('builds action-required cards from inventory and disputes', () => {
    const actions = buildActionRequired({
      products,
      orders,
      disputes: [{ id: 'd1', status: 'open' }],
      seller: { telegramConnected: false },
      telegramStatus: { connected: false },
    });
    expect(actions.some((a) => a.id === 'out-of-stock')).toBe(true);
    expect(actions.some((a) => a.id === 'disputes')).toBe(true);
    expect(actions.some((a) => a.id === 'telegram')).toBe(true);
  });

  it('hides telegram action when shared telegramStatus reports connected', () => {
    const actions = buildActionRequired({
      products: [],
      orders: [],
      disputes: [],
      seller: { telegramConnected: false },
      telegramStatus: { connected: true, username: 'sellerbot' },
    });
    expect(actions.some((a) => a.id === 'telegram')).toBe(false);
  });

  it('summarizes dashboard KPIs', () => {
    const stats = summarizeSellerStats({
      orders,
      products,
      wallet: { pendingBalance: 18, releasedBalance: 36, availableBalance: 36 },
      escrow: [{ status: 'disputed' }],
      withdrawals: [{ status: 'pending' }],
    });
    expect(stats.completedOrders).toBe(1);
    expect(stats.disputedOrders).toBe(1);
    expect(stats.revenue).toBe(36);
    expect(stats.totalSales).toBe(60);
    expect(stats.grossSales).toBe(60);
    expect(stats.activeListings).toBe(1);
    expect(stats.pendingWithdrawals).toBe(1);
    expect(stats.outOfStock).toBe(1);
    expect(stats.repeatBuyers).toBe(1);
    expect(stats.netProfit).toBe(36);
  });

  it('surfaces manual orders awaiting delivery in action required', () => {
    const actions = buildActionRequired({
      products,
      orders: [
        ...orders,
        {
          id: 'm1',
          status: 'escrow',
          deliveryStatus: 'awaiting_delivery',
          amount: 15,
          product: { id: 'p2', title: 'Pack B', deliveryType: 'manual' },
        },
      ],
      disputes: [],
      seller: { telegramConnected: true },
    });
    expect(actions.some((a) => a.id === 'manual-delivery' && a.count === 1)).toBe(true);
  });
});
