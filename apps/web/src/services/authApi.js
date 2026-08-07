import { get, post } from '../lib/apiClient';
import { API_BASE_URL } from '../lib/apiClient';
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
  getGoogleAuthUrl({ intent = 'buyer', returnTo = '', storeName = '', username = '' } = {}) {
    const params = new URLSearchParams();
    if (intent) params.set('intent', intent);
    if (returnTo) params.set('returnTo', returnTo);
    if (storeName) params.set('storeName', storeName);
    if (username) params.set('username', username);
    const query = params.toString();
    return `${API_BASE_URL}/auth/google${query ? `?${query}` : ''}`;
  },

  googleStatus() {
    return get('/auth/google/status').then(({ data }) => data);
  },

  completeGoogleSession({ accessToken, refreshToken, user }, { remember = true } = {}) {
    return saveAuth({ accessToken, refreshToken, user }, remember);
  },

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
