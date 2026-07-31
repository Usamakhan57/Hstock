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
    return patch('/users/me/seller-profile', payload).then(({ data }) => data);
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
};

export default usersApi;
