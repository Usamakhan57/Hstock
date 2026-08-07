import { describe, expect, it } from 'vitest';
import { resolveGoogleCallbackDestination } from '../lib/googleOAuthRedirect';

describe('resolveGoogleCallbackDestination', () => {
  it('allows sellers to reach seller dashboard', () => {
    expect(resolveGoogleCallbackDestination('/seller/dashboard', {
      roles: ['buyer', 'seller'],
    })).toBe('/seller/dashboard');
  });

  it('never sends buyers to seller routes (prevents 403)', () => {
    expect(resolveGoogleCallbackDestination('/seller/dashboard', {
      roles: ['buyer'],
    })).toBe('/dashboard');
  });

  it('falls back to role home when redirect missing', () => {
    expect(resolveGoogleCallbackDestination(null, { roles: ['seller'] })).toBe('/seller/dashboard');
    expect(resolveGoogleCallbackDestination('', { roles: ['buyer'] })).toBe('/dashboard');
  });
});
