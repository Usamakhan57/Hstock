import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getRememberMe,
  getStoredUser,
  persistSession,
} from './tokenStorage';

describe('tokenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('stores tokens in localStorage when remember me is true', () => {
    persistSession({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      user: { id: 'u1', email: 'buyer@example.com', roles: ['buyer'] },
      remember: true,
    });

    expect(getRememberMe()).toBe(true);
    expect(getAccessToken()).toBe('access-1');
    expect(getRefreshToken()).toBe('refresh-1');
    expect(getStoredUser()?.email).toBe('buyer@example.com');
    expect(sessionStorage.getItem('hs_access_token')).toBeNull();
  });

  it('stores tokens in sessionStorage when remember me is false', () => {
    persistSession({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      user: { id: 'u2', roles: ['seller'] },
      remember: false,
    });

    expect(getRememberMe()).toBe(false);
    expect(getAccessToken()).toBe('access-2');
    expect(localStorage.getItem('hs_access_token')).toBeNull();
    expect(sessionStorage.getItem('hs_access_token')).toBe('access-2');
  });

  it('clears tokens from both storages', () => {
    persistSession({
      accessToken: 'a',
      refreshToken: 'r',
      user: { id: 'u' },
      remember: true,
    });
    clearSession();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });
});
