import { get, patch, del } from '../lib/apiClient';

function mapNotification(n) {
  if (!n) return null;
  return {
    id: n.id || n._id,
    type: n.type || 'message',
    title: n.title || '',
    body: n.body || '',
    link: n.link || null,
    read: !!n.read,
    date: n.date || n.createdAt || new Date().toISOString(),
    meta: n.meta || {},
  };
}

export const notificationsApi = {
  async list({ page = 1, limit = 50, unreadOnly } = {}) {
    const params = { page, limit };
    if (unreadOnly) params.unreadOnly = 'true';
    const { data, meta } = await get('/notifications', { params });
    const items = Array.isArray(data) ? data.map(mapNotification) : [];
    return { items, meta };
  },

  async unreadCount() {
    const { data } = await get('/notifications/unread-count');
    return data?.count ?? data ?? 0;
  },

  async markRead(id) {
    const { data } = await patch(`/notifications/${id}/read`, {});
    return mapNotification(data);
  },

  async markAllRead() {
    const { data } = await patch('/notifications/read-all', {});
    return data;
  },

  async remove(id) {
    const { data } = await del(`/notifications/${id}`);
    return data;
  },
};

export default notificationsApi;
