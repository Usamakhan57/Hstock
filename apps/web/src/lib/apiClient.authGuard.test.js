import { describe, expect, it } from 'vitest';
import { isCredentialAuthRequest } from './apiClient';

describe('isCredentialAuthRequest', () => {
  it('treats admin/seller/buyer login and register as credential auth', () => {
    expect(isCredentialAuthRequest('/auth/admin/login')).toBe(true);
    expect(isCredentialAuthRequest('/auth/seller/login')).toBe(true);
    expect(isCredentialAuthRequest('/auth/login')).toBe(true);
    expect(isCredentialAuthRequest('/auth/register')).toBe(true);
    expect(isCredentialAuthRequest('/auth/seller/register')).toBe(true);
  });

  it('does not treat refresh or other APIs as credential auth', () => {
    expect(isCredentialAuthRequest('/auth/refresh')).toBe(false);
    expect(isCredentialAuthRequest('/auth/me')).toBe(false);
    expect(isCredentialAuthRequest('/wallet')).toBe(false);
  });
});
