/**
 * Standard API response envelope:
 * { success, message, data, errors, meta }
 */

export function sendSuccess(res, {
  statusCode = 200,
  message = 'Success',
  data = null,
  meta = null,
  errors = null,
} = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    errors,
    meta,
  });
}

export function sendError(res, {
  statusCode = 500,
  message = 'Internal server error',
  code = 'INTERNAL_ERROR',
  details = undefined,
  errors = undefined,
  meta = null,
  data = null,
} = {}) {
  const normalizedErrors = errors !== undefined
    ? errors
    : details !== undefined
      ? details
      : null;

  return res.status(statusCode).json({
    success: false,
    message,
    data,
    errors: normalizedErrors,
    meta,
    code,
  });
}

export default {
  sendSuccess,
  sendError,
};
