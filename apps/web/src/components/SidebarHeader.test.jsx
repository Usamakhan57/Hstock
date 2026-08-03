import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import SidebarHeader from './SidebarHeader';

describe('SidebarHeader', () => {
  it('makes Wallet and Alerts cards clickable links', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SidebarHeader
          seller={{ storeName: 'Demo Store', email: 'demo@example.com', status: 'approved' }}
          walletBalance={12.5}
          notificationsCount={3}
        />
      </MemoryRouter>,
    );

    expect(html).toContain('href="/seller/earnings"');
    expect(html).toContain('href="/seller/notifications"');
    expect(html).toContain('Open wallet');
    expect(html).toContain('Open alerts');
    expect(html).toContain('$12.50');
    expect(html).toContain('3 unread');
    expect(html).toContain('Live');
  });

  it('shows Pending badge when seller is not approved', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SidebarHeader
          seller={{ storeName: 'Pending Store', email: 'p@example.com', status: 'pending' }}
          walletBalance={0}
          notificationsCount={0}
        />
      </MemoryRouter>,
    );
    expect(html).toContain('Pending');
  });
});
