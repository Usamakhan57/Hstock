import { get, post } from '../../lib/apiClient';

export const telegramAdminApi = {
  overview() {
    return get('/admin/telegram').then(({ data }) => data);
  },

  botStatus() {
    return get('/admin/telegram/status').then(({ data }) => data);
  },

  connectedUsers({ page = 1, limit = 20, search } = {}) {
    const params = { page, limit };
    if (search) params.search = search;
    return get('/admin/telegram/users', { params }).then(({ data, meta }) => ({
      items: Array.isArray(data) ? data : [],
      meta,
    }));
  },

  logs({ page = 1, limit = 30, status, kind } = {}) {
    const params = { page, limit };
    if (status) params.status = status;
    if (kind) params.kind = kind;
    return get('/admin/telegram/logs', { params }).then(({ data, meta }) => ({
      items: Array.isArray(data) ? data : [],
      meta,
    }));
  },

  broadcasts({ page = 1, limit = 20 } = {}) {
    return get('/admin/telegram/broadcasts', { params: { page, limit } }).then(({ data, meta }) => ({
      items: Array.isArray(data) ? data : [],
      meta,
    }));
  },

  createBroadcast(payload) {
    return post('/admin/telegram/broadcasts', payload).then(({ data }) => data);
  },
};

export default telegramAdminApi;
