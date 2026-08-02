import { describe, expect, it } from 'vitest';
import { ApiError, messageForStatus, normalizeApiError } from './apiErrors';

describe('apiErrors', () => {
  it('maps known HTTP statuses to user-facing messages', () => {
    expect(messageForStatus(401)).toMatch(/sign in/i);
    expect(messageForStatus(403)).toMatch(/permission/i);
    expect(messageForStatus(404)).toMatch(/not found/i);
    expect(messageForStatus(409)).toMatch(/conflict/i);
    expect(messageForStatus(422)).toMatch(/form/i);
    expect(messageForStatus(429)).toMatch(/too many/i);
    expect(messageForStatus(500)).toMatch(/wrong/i);
  });

  it('normalizes network failures', () => {
    const error = normalizeApiError({ code: 'ERR_NETWORK', message: 'Network Error' });
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.message).toMatch(/network/i);
  });

  it('preserves backend response message and status', () => {
    const error = normalizeApiError({
      response: {
        status: 422,
        data: { message: 'Email already registered', code: 'EMAIL_TAKEN', errors: { email: 'taken' } },
      },
    });
    expect(error.status).toBe(422);
    expect(error.message).toBe('Email already registered');
    expect(error.code).toBe('EMAIL_TAKEN');
    expect(error.errors).toEqual({ email: 'taken' });
  });

  it('maps refresh-token required errors to a sign-in message', () => {
    const error = normalizeApiError({
      response: {
        status: 401,
        data: { message: 'Refresh token required', code: 'REFRESH_REQUIRED' },
      },
    });
    expect(error.status).toBe(401);
    expect(error.code).toBe('REFRESH_REQUIRED');
    expect(error.message).toMatch(/sign in/i);
    expect(error.message).not.toMatch(/refresh token required/i);
  });
});
