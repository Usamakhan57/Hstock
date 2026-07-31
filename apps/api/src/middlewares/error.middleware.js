import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';
import { sendError } from '../utils/response.js';

export function notFoundHandler(req, res, next) {
  next(
    new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, {
      code: 'NOT_FOUND',
    }),
  );
}

export function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';
  let details = err.details;

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier';
    code = 'INVALID_ID';
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate key conflict';
    code = 'DUPLICATE_KEY';
  }

  if (err.message?.includes('not allowed by CORS')) {
    statusCode = 403;
    code = 'CORS_DENIED';
  }

  const isOperational = err instanceof AppError ? err.isOperational : statusCode < 500;

  if (statusCode >= 500) {
    logger.error(message, {
      code,
      statusCode,
      path: req.originalUrl,
      method: req.method,
      stack: err.stack,
    });
  } else {
    logger.warn(message, {
      code,
      statusCode,
      path: req.originalUrl,
      method: req.method,
    });
  }

  return sendError(res, {
    statusCode,
    message: statusCode >= 500 && env.isProduction && !isOperational
      ? 'Internal server error'
      : message,
    code,
    errors: env.isProduction && statusCode >= 500 ? null : (details ?? null),
    details: env.isProduction && statusCode >= 500 ? undefined : details,
  });
}

export default {
  notFoundHandler,
  errorHandler,
};
