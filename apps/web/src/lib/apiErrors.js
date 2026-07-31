/**
 * Map backend / network failures to user-facing messages.
 */

export class ApiError extends Error {
  constructor(message, {
    status = 0,
    code = 'UNKNOWN',
    errors = null,
    data = null,
  } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.data = data;
  }
}

export function messageForStatus(status, fallback) {
  switch (status) {
    case 401:
      return 'Please sign in to continue.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This action conflicts with the current state. Refresh and try again.';
    case 422:
      return 'Please check the form and try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
      return 'Something went wrong on our side. Please try again.';
    default:
      return fallback || 'Request failed. Please try again.';
  }
}

export function normalizeApiError(error) {
  if (error instanceof ApiError) return error;

  if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return new ApiError('Network failure. Check your connection and try again.', {
      status: 0,
      code: 'NETWORK_ERROR',
    });
  }

  const response = error?.response;
  if (!response) {
    return new ApiError(error?.message || 'Unexpected error', {
      status: 0,
      code: 'UNKNOWN',
    });
  }

  const payload = response.data || {};
  const status = response.status;
  const message = payload.message
    || messageForStatus(status, error.message);

  return new ApiError(message, {
    status,
    code: payload.code || `HTTP_${status}`,
    errors: payload.errors || null,
    data: payload.data || null,
  });
}

export default {
  ApiError,
  messageForStatus,
  normalizeApiError,
};
