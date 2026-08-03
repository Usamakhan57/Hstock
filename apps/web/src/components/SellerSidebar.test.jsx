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

describe('SellerSidebar mobile panel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a top-anchored drawer panel (not a bottom sheet)', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SellerSidebar
          open
          closing={false}
          onClose={() => {}}
          seller={{ storeName: 'Demo', email: 's@example.com', status: 'approved', slug: 'demo' }}
          walletBalance={0}
          notificationsCount={0}
          onLogout={() => {}}
        />
      </MemoryRouter>,
    );

    expect(html).toContain('data-testid="seller-drawer-panel"');
    expect(html).toContain('top-[calc(4rem+env(safe-area-inset-top,0px))]');
    expect(html).toContain('-translate-y-full');
    expect(html).not.toContain('bottom-0 translate-y-full');
  });
});
