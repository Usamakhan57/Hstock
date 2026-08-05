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
  const code = payload.code || `HTTP_${status}`;
  // Never surface raw refresh-token errors to users — send them to sign in.
  if (code === 'REFRESH_REQUIRED' || /refresh token required/i.test(String(payload.message || ''))) {
    return new ApiError('Please sign in to continue.', {
      status: 401,
      code: 'REFRESH_REQUIRED',
      errors: payload.errors || null,
      data: payload.data || null,
    });
  }

  const fieldErrors = formatFieldErrors(payload.errors || payload.details);
  let message = payload.message || messageForStatus(status, error.message);
  // Prefer concrete field errors over the generic "Validation failed" label.
  if (fieldErrors && /^validation failed\.?$/i.test(String(message || '').trim())) {
    message = fieldErrors;
  }

  return new ApiError(message, {
    status,
    code,
    errors: payload.errors || null,
    data: payload.data || null,
  });
}

/** Turn API `errors` arrays/objects into a short user-facing string. */
export function formatFieldErrors(errors) {
  if (!errors) return null;
  if (typeof errors === 'string') return errors;
  if (Array.isArray(errors)) {
    const parts = errors.map((entry) => {
      if (!entry) return null;
      if (typeof entry === 'string') return entry;
      const path = entry.path || entry.field || entry.param;
      const msg = entry.message || entry.msg || entry.error;
      if (path && msg) return `${path}: ${msg}`;
      return msg || path || null;
    }).filter(Boolean);
    return parts.length ? parts.join('; ') : null;
  }
  if (typeof errors === 'object') {
    const parts = Object.entries(errors).map(([key, value]) => {
      if (value == null) return null;
      if (typeof value === 'string') return `${key}: ${value}`;
      if (value?.message) return `${key}: ${value.message}`;
      return `${key}: ${String(value)}`;
    }).filter(Boolean);
    return parts.length ? parts.join('; ') : null;
  }
  return null;
}

export default {
  ApiError,
  messageForStatus,
  normalizeApiError,
  formatFieldErrors,
};
