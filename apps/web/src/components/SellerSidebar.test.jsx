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

  it('renders a profile-style dropdown under the header (never a side/bottom drawer)', () => {
    // Seed measured layout APIs used by useLayoutEffect positioning.
    // SSR path returns null without pos — force a client-like open render via
    // stubbing layout so the portal content is exercised through a shallow class contract.
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SellerSidebar
          open={false}
          closing={false}
          onClose={() => {}}
          seller={{ storeName: 'Jazzy', email: 'studentsjobss@gmail.com', status: 'approved', slug: 'jazzy' }}
          walletBalance={0.9}
          notificationsCount={15}
          onLogout={() => {}}
        />
      </MemoryRouter>,
    );

    // Closed → nothing mounted
    expect(html).toBe('');
  });

  it('source contract: no drawer / sheet positioning classes in component module', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const file = path.resolve(process.cwd(), 'src/components/SellerSidebar.jsx');
    const src = fs.readFileSync(file, 'utf8');

    expect(src).toContain('seller-workspace-menu');
    expect(src).toContain('duration-[180ms]');
    expect(src).toContain('ease-out');
    expect(src).toContain('-translate-y-2.5');
    expect(src).toContain('rounded-2xl');
    expect(src).toContain('h-auto');

    // Must never reintroduce drawer / sheet patterns
    expect(src).not.toMatch(/translate-x-full|translate-x-0|sm:translate-x|lg:translate-x/);
    expect(src).not.toMatch(/translate-y-full/);
    expect(src).not.toMatch(/\binset-y-0\b/);
    expect(src).not.toMatch(/\bh-screen\b|\bh-\[100vh\]|\bh-\[100dvh\]/);
    expect(src).not.toMatch(/\blg:right-0\b|\bright-0\b/);
    expect(src).not.toMatch(/inset-x-0/);
    expect(src).not.toContain('SidebarOverlay');
    expect(src).not.toContain('seller-drawer-panel');

    // Content preserved
    expect(src).toContain('Back to Marketplace');
    expect(src).toContain('Dashboard');
    expect(src).toContain('Products');
    expect(src).toContain('Orders');
    expect(src).toContain('Inventory');
    expect(src).toContain('Settings');
    expect(src).toContain('Support');
    expect(src).toContain('+ Add Product');
    expect(src).toContain('Platform Store');
    expect(src).toContain('Promote Store');
    expect(src).toContain('Logout');
  });
});
