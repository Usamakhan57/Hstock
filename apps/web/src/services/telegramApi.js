import { get, post, patch, del } from '../lib/apiClient';
import { clearRequestCache } from '../lib/requestCache';

const STATUS_EVENT = 'apnastore:telegram-status';

function mapStatus(data = {}) {
  return {
    connected: Boolean(data.connected),
    username: data.username || null,
    telegramUserId: data.telegramUserId || null,
    connectedAt: data.connectedAt || null,
    notificationsEnabled: data.notificationsEnabled !== false,
  };
}

function emitStatus(status) {
  if (typeof window === 'undefined' || !status) return;
  try {
    window.dispatchEvent(new CustomEvent(STATUS_EVENT, { detail: status }));
  } catch {
    // ignore
  }
}

async function invalidateTelegramCaches() {
  clearRequestCache('telegram');
  clearRequestCache('seller-statistics');
  clearRequestCache('sellers');
  try {
    const { invalidateSellerCatalog } = await import('./catalogCache');
    await invalidateSellerCatalog();
  } catch {
    // catalog optional during early boot / tests
  }
}

export const telegramApi = {
  STATUS_EVENT,

  status() {
    return get('/telegram/me').then(({ data }) => {
      const status = mapStatus(data);
      emitStatus(status);
      return status;
    });
  },

  connect() {
    return post('/telegram/me/connect', {}).then(async ({ data }) => {
      await invalidateTelegramCaches();
      const status = mapStatus(data?.status);
      emitStatus(status);
      return {
        url: data?.url,
        expiresAt: data?.expiresAt,
        status,
      };
    });
  },

  updateSettings({ notificationsEnabled }) {
    return patch('/telegram/me/settings', { notificationsEnabled }).then(async ({ data }) => {
      await invalidateTelegramCaches();
      const status = mapStatus(data);
      emitStatus(status);
      return status;
    });
  },

  disconnect() {
    return del('/telegram/me').then(async ({ data }) => {
      await invalidateTelegramCaches();
      const status = mapStatus(data);
      emitStatus(status);
      return status;
    });
  },

  invalidateCaches: invalidateTelegramCaches,

  subscribe(listener) {
    if (typeof window === 'undefined' || typeof listener !== 'function') {
      return () => {};
    }
    const handler = (event) => listener(event.detail);
    window.addEventListener(STATUS_EVENT, handler);
    return () => window.removeEventListener(STATUS_EVENT, handler);
  },
};

export default telegramApi;
