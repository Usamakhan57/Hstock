import { get, post } from '../lib/apiClient';
import { persistSession, clearSession, getRememberMe } from '../lib/tokenStorage';

function saveAuth(data, remember = getRememberMe()) {
  persistSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: data.user,
    remember,
  });
  return data;
}

export const authApi = {
  register(payload, { remember = true } = {}) {
    return post('/auth/register', payload).then(({ data }) => saveAuth(data, remember));
  },

  login(payload, { remember = true } = {}) {
    return post('/auth/login', payload).then(({ data }) => saveAuth(data, remember));
  },

  sellerRegister(payload, { remember = true } = {}) {
    return post('/auth/seller/register', payload).then(({ data }) => saveAuth(data, remember));
  },

  sellerLogin(payload, { remember = true } = {}) {
    return post('/auth/seller/login', payload).then(({ data }) => saveAuth(data, remember));
  },

  adminLogin(payload, { remember = true } = {}) {
    return post('/auth/admin/login', payload).then(({ data }) => saveAuth(data, remember));
  },

  async logout() {
    try {
      await post('/auth/logout', {});
    } catch {
      // Clear local session even if the API call fails.
    } finally {
      clearSession();
    }
  },

  me() {
    return get('/auth/me').then(({ data }) => data);
  },

  forgotPassword(email) {
    return post('/auth/forgot-password', { email }).then(({ data, message }) => ({ data, message }));
  },

  resetPassword({ token, password }) {
    return post('/auth/reset-password', { token, password }).then(({ data }) => data);
  },

  verifyEmail(token) {
    return post('/auth/verify-email', { token }).then(({ data }) => data);
  },
};

export default authApi;
