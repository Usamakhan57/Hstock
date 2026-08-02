import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';
import { sendError } from '../utils/response.js';
import {
  ASSET_DUPLICATE_CODE,
  ASSET_DUPLICATE_MESSAGE,
} from '../constants/assetUniqueness.js';

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
    const keyPattern = err.keyPattern || {};
    const fields = Object.keys(keyPattern);
    if (keyPattern.assetIdentifierNormalized) {
      message = ASSET_DUPLICATE_MESSAGE;
      code = ASSET_DUPLICATE_CODE;
    } else if (
      fields.some((field) => [
        'orderNumber',
        'cryptomusOrderId',
        'cryptomusUuid',
        'order',
        'depositNumber',
      ].includes(field))
    ) {
      message = 'A checkout session could not be created due to a conflict. Please try again.';
      code = 'CHECKOUT_CONFLICT';
      details = { fields };
    } else {
      message = 'This record already exists. Please refresh and try again.';
      code = 'DUPLICATE_KEY';
      details = fields.length ? { fields } : details;
    }
  }

  if (err.message?.includes('not allowed by CORS')) {
    statusCode = 403;
    code = 'CORS_DENIED';
  }

  // express.json / urlencoded body limit
  if (err?.type === 'entity.too.large' || err?.status === 413 || err?.statusCode === 413) {
    statusCode = 413;
    message = err.message?.includes('Image is too large')
      ? err.message
      : 'Upload is too large. Maximum allowed size is 25 MB.';
    code = err.code && err.code !== 'INTERNAL_ERROR' ? err.code : 'PAYLOAD_TOO_LARGE';
  }

  // multer file size (when not already wrapped by upload middleware)
  if (err?.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'Image is too large. Maximum allowed size is 25 MB.';
    code = 'FILE_TOO_LARGE';
  }

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

  // Never leak internal/provider details on 5xx in production
  const hideDetails = env.isProduction && statusCode >= 500;
  return sendError(res, {
    statusCode,
    message: hideDetails ? 'Internal server error' : message,
    code: hideDetails ? 'INTERNAL_ERROR' : code,
    errors: hideDetails ? null : (details ?? null),
    details: hideDetails ? undefined : details,
    meta: hideDetails ? null : undefined,
  });
}

export default {
  notFoundHandler,
  errorHandler,
};
