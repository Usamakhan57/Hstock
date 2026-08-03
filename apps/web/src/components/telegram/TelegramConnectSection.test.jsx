import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../../services/telegramApi', () => ({
  telegramApi: {
    status: vi.fn(async () => ({
      connected: false,
      username: null,
      telegramUserId: null,
      connectedAt: null,
      notificationsEnabled: true,
    })),
    connect: vi.fn(),
    disconnect: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import TelegramConnectSection from './TelegramConnectSection';
import { telegramApi } from '../../services/telegramApi';

describe('TelegramConnectSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Telegram Connection title and connect CTA for disconnected users', () => {
    telegramApi.status.mockResolvedValue({
      connected: false,
      username: null,
      telegramUserId: null,
      connectedAt: null,
      notificationsEnabled: true,
    });

    const html = renderToStaticMarkup(
      <TelegramConnectSection
        compact
        pollUntilConnected
        title="Telegram Connection"
        connectLabel="Connect Telegram"
      />,
    );

    expect(html).toContain('Telegram Connection');
    expect(html).toContain('Connect Telegram');
    expect(html).toMatch(/Not Connected|Connection Status/);
    expect(html).toContain('#229ED9');
  });
});
