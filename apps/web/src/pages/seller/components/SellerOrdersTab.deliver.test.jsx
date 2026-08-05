import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('../../../services/ordersApi', () => ({
  ordersApi: {
    deliver: vi.fn(),
  },
}));

import SellerOrdersTab from './SellerOrdersTab';

describe('SellerOrdersTab deliver action', () => {
  it('renders Deliver Order for manual escrow orders awaiting delivery', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SellerOrdersTab
          orders={[
            {
              id: 'HS-MANUAL-1',
              _id: '507f1f77bcf86cd799439011',
              status: 'escrow',
              deliveryStatus: 'awaiting_delivery',
              deliveryStatusLabel: 'Awaiting Delivery',
              paymentStatusLabel: 'Paid',
              escrowStatusLabel: 'Held',
              amount: 25,
              date: '2026-08-04T00:00:00.000Z',
              canDeliver: true,
              product: { title: 'Manual Pack', deliveryType: 'manual' },
              buyer: { email: 'buyer@example.com' },
            },
            {
              id: 'HS-INSTANT-1',
              _id: '507f1f77bcf86cd799439012',
              status: 'escrow',
              deliveryStatus: 'delivered',
              canDeliver: false,
              product: { title: 'Instant Pack', deliveryType: 'automatic' },
              buyer: { email: 'buyer2@example.com' },
              amount: 10,
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(html).toContain('data-testid="seller-deliver-order"');
    expect(html).toContain('Deliver Order');
    expect(html).toContain('HS-MANUAL-1');
    expect(html).toContain('Manual Pack');
  });

  it('does not render Deliver Order for instant or already-delivered orders', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SellerOrdersTab
          orders={[
            {
              id: 'HS-INSTANT-2',
              status: 'escrow',
              deliveryStatus: 'delivered',
              canDeliver: false,
              product: { title: 'Instant Pack', deliveryType: 'automatic' },
              amount: 10,
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(html).not.toContain('data-testid="seller-deliver-order"');
  });
});
