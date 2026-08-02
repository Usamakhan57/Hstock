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

function isAuthMutationUrl(url = '') {
  const path = String(url);
  return (
    path.includes('/auth/refresh')
    || path.includes('/auth/login')
    || path.includes('/auth/register')
    || path.includes('/auth/admin/login')
    || path.includes('/auth/seller/login')
    || path.includes('/auth/seller/register')
    || path.includes('/auth/logout')
  );
}

function redirectToLoginIfNeeded() {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname || '';
  if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
    window.location.assign(`/admin/login?next=${encodeURIComponent(path)}`);
    return;
  }
  if (path.startsWith('/seller') && !path.startsWith('/seller/login') && !path.startsWith('/seller/register')) {
    window.location.assign(`/seller/login?next=${encodeURIComponent(path)}`);
  }
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken();
      // Prefer body token; cookie may still work when storage was wiped.
      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          refreshToken ? { refreshToken } : {},
          { withCredentials: true },
        );
        const payload = response.data?.data || {};
        if (!payload.accessToken) {
          throw new ApiError('Please sign in to continue.', {
            status: 401,
            code: 'REFRESH_REQUIRED',
          });
        }
        persistSession({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken || refreshToken || undefined,
          user: payload.user || getStoredUser(),
          remember: getRememberMe(),
        });
        return payload.accessToken;
      } catch (error) {
        clearSession();
        const normalized = normalizeApiError(error);
        if (normalized.code === 'REFRESH_REQUIRED' || normalized.status === 401) {
          throw new ApiError('Please sign in to continue.', {
            status: 401,
            code: 'REFRESH_REQUIRED',
          });
        }
        throw normalized;
      }
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
    const isAuthCall = isAuthMutationUrl(url);

    if (status === 401 && !original._retry && !isAuthCall) {
      original._retry = true;
      const hasRefreshToken = Boolean(getRefreshToken());
      // No refresh token and this is not an auth call → send user to login
      // instead of surfacing "Refresh token required".
      if (!hasRefreshToken) {
        // Still attempt cookie-based refresh once; if it fails, redirect.
        try {
          const accessToken = await refreshAccessToken();
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(original);
        } catch (refreshError) {
          clearSession();
          redirectToLoginIfNeeded();
          throw refreshError;
        }
      }

      try {
        const accessToken = await refreshAccessToken();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(original);
      } catch (refreshError) {
        clearSession();
        redirectToLoginIfNeeded();
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

export { refreshAccessToken };
export default apiClient;
