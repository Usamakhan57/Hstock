import { get, patch, post } from '../lib/apiClient';

export const usersApi = {
  me() {
    return get('/users/me').then(({ data }) => data);
  },

  updateMe(payload) {
    return patch('/users/me', payload).then(({ data }) => data);
  },

  updateBuyerProfile(payload) {
    return patch('/users/me/profile', payload).then(({ data }) => data);
  },

  updateSellerProfile(payload) {
    return patch('/users/me/seller-profile', payload).then(async ({ data }) => {
      const { clearRequestCache } = await import('../lib/requestCache');
      clearRequestCache('sellers');
      clearRequestCache('products');
      clearRequestCache('product');
      clearRequestCache('seller-statistics');
      try {
        const { invalidateSellerCatalog } = await import('./catalogCache');
        await invalidateSellerCatalog();
      } catch {
        // catalog may not be hydrated yet
      }
      return data;
    });
  },

  changePassword({ currentPassword, newPassword }) {
    return post('/users/me/change-password', { currentPassword, newPassword }).then(({ data }) => data);
  },

  activity({ page = 1, limit = 30 } = {}) {
    return get('/users/me/activity', { params: { page, limit } }).then(({ data, meta }) => ({
      items: Array.isArray(data) ? data : [],
      meta,
    }));
  },

  adminList({ page = 1, limit = 50, role, status, search } = {}) {
    const params = { page, limit };
    if (role) params.role = role;
    if (status) params.status = status;
    if (search) params.search = search;
    return get('/users', { params }).then(({ data, meta }) => ({
      items: Array.isArray(data) ? data.map((u) => ({
        ...u,
        id: u.id || u._id,
      })) : [],
      meta,
    }));
  },

  adminUpdate(id, payload) {
    return patch(`/users/${id}`, payload).then(({ data }) => data);
  },

  adminInvite(payload) {
    return post('/users/invite', payload).then(({ data }) => data);
  },

  async adminDelete(id, { confirm } = {}) {
    const { del } = await import('../lib/apiClient');
    const { data } = await del(`/admin/users/${id}`, {
      data: confirm ? { confirm } : undefined,
    });
    return data;
  },
};

export default usersApi;
