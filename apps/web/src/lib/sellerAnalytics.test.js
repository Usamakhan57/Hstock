import { describe, expect, it } from 'vitest';
import {
  buildSalesChart,
  buildBestSelling,
  buildTopCategories,
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
      product: { id: 'p1', title: 'Pack A', cat: 'Instagram', img: '' },
    },
    {
      id: '2',
      status: 'disputed',
      amount: 20,
      sellerAmount: 18,
      quantity: 1,
      date: new Date().toISOString(),
      product: { id: 'p1', title: 'Pack A', cat: 'Instagram', img: '' },
      disputeOpen: true,
    },
    {
      id: '3',
      status: 'cancelled',
      amount: 10,
      quantity: 1,
      date: new Date().toISOString(),
      product: { id: 'p2', title: 'Pack B', cat: 'TikTok', img: '' },
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

  it('summarizes dashboard KPIs', () => {
    const stats = summarizeSellerStats({
      orders,
      products: [{ status: 'live' }, { status: 'draft' }],
      wallet: { pendingBalance: 18, releasedBalance: 36, availableBalance: 36 },
      escrow: [{ status: 'disputed' }],
      withdrawals: [{ status: 'pending' }],
    });
    expect(stats.completedOrders).toBe(1);
    expect(stats.disputedOrders).toBe(1);
    expect(stats.revenue).toBe(36);
    expect(stats.activeListings).toBe(1);
    expect(stats.pendingWithdrawals).toBe(1);
  });
});
