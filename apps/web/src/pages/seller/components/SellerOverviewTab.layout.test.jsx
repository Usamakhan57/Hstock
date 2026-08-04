import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../services/storePromotionApi', () => ({
  storePromotionApi: {
    getStatus: vi.fn(async () => ({ activePromotion: null })),
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="chart">{children}</div>,
  AreaChart: ({ children }) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
}));

import SellerOverviewTab from './SellerOverviewTab';

const emptyStats = {
  withdrawableBalance: 0,
  availableBalance: 0,
  netProfit: 0,
  monthSales: 0,
  grossSales: 0,
  todaySales: 0,
  weekSales: 0,
  ordersCount: 0,
  pendingOrders: 0,
  completedOrders: 0,
  disputedOrders: 0,
  repeatRate: 0,
  repeatBuyers: 0,
  avgOrderValue: 0,
  refundedAmount: 0,
  liveProducts: 0,
  outOfStock: 0,
  totalInventory: 0,
  draftProducts: 0,
  openDisputes: 0,
};

describe('SellerOverviewTab mobile layout contract', () => {
  it('uses normal document-flow stacking (flex column + gap), not absolute card shells', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SellerOverviewTab
          seller={{ storeName: 'Demo Store', status: 'approved', slug: 'demo' }}
          stats={emptyStats}
          orders={[]}
          salesChart7={[]}
          salesChart30={[]}
          bestSelling={[]}
          lowestStock={[]}
          mostViewed={[]}
          actionRequired={[]}
          joinedDate="August 2026"
        />
      </MemoryRouter>,
    );

    expect(html).toContain('data-testid="seller-overview-stack"');
    expect(html).toContain('flex w-full min-w-0 flex-col gap-5');
    expect(html).toContain('grid-cols-1');
    expect(html).toContain('Top Selling Products');
    expect(html).toContain('Recent Orders');
    // Cards must not use absolute positioning for section shells.
    expect(html).not.toMatch(/class="[^"]*absolute[^"]*rounded-\[1\.75rem\]/);
  });
});
