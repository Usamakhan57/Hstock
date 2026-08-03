import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../../../services/telegramApi', () => ({
  telegramApi: {
    status: vi.fn(async () => ({ connected: false, username: null })),
    connect: vi.fn(),
  },
}));

vi.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import SellerVerificationBanner from './SellerVerificationBanner';
import { telegramApi } from '../../../services/telegramApi';

describe('SellerVerificationBanner approved card', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removes commission and keeps store URL / open store for approved sellers', () => {
    telegramApi.status.mockResolvedValue({ connected: false, username: null });
    const html = renderToStaticMarkup(
      <SellerVerificationBanner
        seller={{
          status: 'approved',
          storeName: 'Verify Store',
          slug: 'verify-store',
          commissionRate: 10,
        }}
      />,
    );

    expect(html).toContain('Seller Account Approved');
    expect(html).toContain('Approved');
    expect(html).toContain('Public Store URL');
    expect(html).toContain('Open Store');
    expect(html).toMatch(/Checking Telegram|Connect Telegram|Telegram Connected/);
    expect(html).not.toContain('Commission');
    expect(html).not.toContain('10%');
  });
});
