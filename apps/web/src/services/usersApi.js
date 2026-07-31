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
};

export default usersApi;
