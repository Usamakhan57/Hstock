import { get, post, patch, del } from '../lib/apiClient';

function mapStatus(data = {}) {
  return {
    connected: Boolean(data.connected),
    username: data.username || null,
    telegramUserId: data.telegramUserId || null,
    connectedAt: data.connectedAt || null,
    notificationsEnabled: data.notificationsEnabled !== false,
  };
}

export const telegramApi = {
  status() {
    return get('/telegram/me').then(({ data }) => mapStatus(data));
  },

  connect() {
    return post('/telegram/me/connect', {}).then(({ data }) => ({
      url: data?.url,
      expiresAt: data?.expiresAt,
      status: mapStatus(data?.status),
    }));
  },

  updateSettings({ notificationsEnabled }) {
    return patch('/telegram/me/settings', { notificationsEnabled }).then(({ data }) => mapStatus(data));
  },

  disconnect() {
    return del('/telegram/me').then(({ data }) => mapStatus(data));
  },
};

export default telegramApi;
