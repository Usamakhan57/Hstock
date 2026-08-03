import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node) => node,
  };
});

import SellerSidebar from './SellerSidebar';

describe('SellerSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a top-anchored mobile drawer that stacks above the header on desktop', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SellerSidebar
          open
          closing={false}
          onClose={() => {}}
          seller={{ storeName: 'Jazzy', email: 'studentsjobss@gmail.com', status: 'approved', slug: 'jazzy' }}
          walletBalance={0.9}
          notificationsCount={15}
          onLogout={() => {}}
        />
      </MemoryRouter>,
    );

    expect(html).toContain('data-testid="seller-drawer-panel"');
    expect(html).toContain('top-[calc(4rem+env(safe-area-inset-top,0px))]');
    expect(html).toContain('-translate-y-full');
    expect(html).toContain('z-[100]');
    expect(html).toContain('z-[101]');
    expect(html).toContain('sm:top-0');
    expect(html).toContain('Back to Marketplace');
    expect(html).toContain('Dashboard');
    expect(html).toContain('Customers');
    expect(html).toContain('Inventory');
    expect(html).toContain('Analytics');
    expect(html).toContain('Withdrawals');
    expect(html).toContain('Disputes');
    expect(html).toContain('+ Add Product');
    expect(html).toContain('Platform Store');
    expect(html).toContain('Promote Store');
    expect(html).toContain('Logout');
    expect(html).toContain('Live');
    expect(html).not.toContain('bottom-0 translate-y-full');
  });
});
