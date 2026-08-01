import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/apiClient', () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

import { get, post, patch, del } from '../lib/apiClient';
import { telegramApi } from './telegramApi';

describe('telegramApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps connection status without exposing chat ids', async () => {
    get.mockResolvedValue({
      data: {
        connected: true,
        username: 'buyer',
        telegramUserId: '42',
        connectedAt: '2026-08-01T00:00:00.000Z',
        notificationsEnabled: true,
        chatId: 'secret',
      },
    });

    const status = await telegramApi.status();
    expect(get).toHaveBeenCalledWith('/telegram/me');
    expect(status.connected).toBe(true);
    expect(status.username).toBe('buyer');
    expect(status.telegramUserId).toBe('42');
    expect(status.chatId).toBeUndefined();
  });

  it('requests connect link and settings updates', async () => {
    post.mockResolvedValue({
      data: {
        url: 'https://t.me/ApnaStoreBot?start=abc',
        expiresAt: '2026-08-01T00:15:00.000Z',
        status: { connected: false },
      },
    });
    patch.mockResolvedValue({
      data: { connected: true, notificationsEnabled: false, username: 'x', telegramUserId: '1' },
    });
    del.mockResolvedValue({
      data: { connected: false, notificationsEnabled: true },
    });

    const connect = await telegramApi.connect();
    expect(post).toHaveBeenCalledWith('/telegram/me/connect', {});
    expect(connect.url).toContain('t.me/ApnaStoreBot');

    const settings = await telegramApi.updateSettings({ notificationsEnabled: false });
    expect(patch).toHaveBeenCalledWith('/telegram/me/settings', { notificationsEnabled: false });
    expect(settings.notificationsEnabled).toBe(false);

    const disconnected = await telegramApi.disconnect();
    expect(del).toHaveBeenCalledWith('/telegram/me');
    expect(disconnected.connected).toBe(false);
  });
});
