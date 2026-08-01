/**
 * Centralized Axios API client for ApnaStore backend (`/api/v1`).
 * - JWT injection
 * - Auto refresh + single retry
 * - Standard error normalization
 */
import axios from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  persistSession,
  clearSession,
  getRememberMe,
  getStoredUser,
} from './tokenStorage';
import { ApiError, normalizeApiError } from './apiErrors';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

let refreshPromise = null;

export function isCredentialAuthRequest(url = '') {
  // Never attempt silent refresh for credential auth endpoints — a 401 here
  // means invalid credentials (or similar), not an expired access token.
  return (
    url.includes('/auth/login')
    || url.includes('/auth/register')
    || url.includes('/auth/seller/login')
    || url.includes('/auth/seller/register')
    || url.includes('/auth/admin/login')
  );
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken();
      // Without a refresh cookie/token there is nothing to rotate — fail fast
      // so callers see the original API error instead of "Refresh token required".
      if (!refreshToken) {
        throw new ApiError('Session expired. Please sign in again.', {
          status: 401,
          code: 'REFRESH_REQUIRED',
        });
      }
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { withCredentials: true },
      );
      const payload = response.data?.data || {};
      if (!payload.accessToken) {
        throw new ApiError('Session expired. Please sign in again.', {
          status: 401,
          code: 'REFRESH_REQUIRED',
        });
      }
      persistSession({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken || refreshToken,
        user: payload.user || getStoredUser(),
        remember: getRememberMe(),
      });
      return payload.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    const url = String(original.url || '');
    const isAuthRefresh = url.includes('/auth/refresh');
    const isCredentialAuth = isCredentialAuthRequest(url);

    if (status === 401 && !original._retry && !isAuthRefresh && !isCredentialAuth) {
      // Only attempt refresh when a refresh token is already present.
      if (!getRefreshToken()) {
        throw normalizeApiError(error);
      }
      original._retry = true;
      try {
        const accessToken = await refreshAccessToken();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(original);
      } catch (refreshError) {
        clearSession();
        throw normalizeApiError(refreshError);
      }
    }

    throw normalizeApiError(error);
  },
);

/** Unwrap `{ success, data, meta, message }` envelope. */
export async function apiRequest(config) {
  const response = await apiClient(config);
  const body = response.data;
  if (body && typeof body === 'object' && 'success' in body) {
    if (body.success === false) {
      throw new ApiError(body.message || 'Request failed', {
        status: response.status,
        code: body.code || 'REQUEST_FAILED',
        errors: body.errors,
        data: body.data,
      });
    }
    return {
      data: body.data,
      meta: body.meta,
      message: body.message,
      raw: body,
    };
  }
  return { data: body, meta: null, message: null, raw: body };
}

export function get(url, config = {}) {
  return apiRequest({ ...config, method: 'GET', url });
}

export function post(url, data, config = {}) {
  return apiRequest({ ...config, method: 'POST', url, data });
}

export function patch(url, data, config = {}) {
  return apiRequest({ ...config, method: 'PATCH', url, data });
}

export function put(url, data, config = {}) {
  return apiRequest({ ...config, method: 'PUT', url, data });
}

export function del(url, config = {}) {
  return apiRequest({ ...config, method: 'DELETE', url });
}

export default apiClient;
