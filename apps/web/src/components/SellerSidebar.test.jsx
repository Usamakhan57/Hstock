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

  it('renders a header-anchored top dropdown (never a bottom sheet)', () => {
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
    // Anchored under the sticky marketplace header
    expect(html).toContain('top-[calc(4rem+env(safe-area-inset-top,0px))]');
    // Top-down dropdown motion (closed state before enter RAF)
    expect(html).toContain('-translate-y-5');
    expect(html).toContain('opacity-0');
    expect(html).toContain('duration-[180ms]');
    expect(html).toContain('ease-out');
    // Desktop right-side panel still below header (not full-viewport sheet)
    expect(html).toContain('lg:right-0');
    expect(html).toContain('lg:w-[420px]');
    // Must never use bottom-sheet positioning / bottom-up motion
    expect(html).not.toContain('bottom-0 translate-y-full');
    expect(html).not.toContain('translate-y-full');
    expect(html).not.toContain('slide-in-from-bottom');
    expect(html).not.toContain('sm:translate-x-full');
    expect(html).not.toContain('sm:top-0');
    // Content preserved
    expect(html).toContain('Back to Marketplace');
    expect(html).toContain('Dashboard');
    expect(html).toContain('Products');
    expect(html).toContain('Orders');
    expect(html).toContain('Inventory');
    expect(html).toContain('Settings');
    expect(html).toContain('Support');
    expect(html).toContain('Disputes');
    expect(html).toContain('+ Add Product');
    expect(html).toContain('Platform Store');
    expect(html).toContain('Promote Store');
    expect(html).toContain('Logout');
    expect(html).toContain('Live');
  });

  it('keeps overlay starting below the header (not covering it)', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SellerSidebar
          open
          closing={false}
          onClose={() => {}}
          seller={{ storeName: 'Jazzy', status: 'approved' }}
          walletBalance={1.8}
          notificationsCount={13}
          onLogout={() => {}}
        />
      </MemoryRouter>,
    );

    expect(html).toContain('data-testid="seller-drawer-overlay"');
    expect(html).toContain('top-[calc(4rem+env(safe-area-inset-top,0px))]');
    expect(html).not.toMatch(/seller-drawer-overlay[^>]*sm:top-0/);
  });
});
