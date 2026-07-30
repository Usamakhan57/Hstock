import { AppError } from '../utils/AppError.js';

/**
 * Zod-based request validation middleware factory.
 * @param {{ body?: import('zod').ZodTypeAny, query?: import('zod').ZodTypeAny, params?: import('zod').ZodTypeAny }} schemas
 */
export function validate(schemas = {}) {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Simple required-fields guard for future lightweight checks.
 */
export function requireFields(fields = [], source = 'body') {
  return (req, _res, next) => {
    const payload = req[source] || {};
    const missing = fields.filter((field) => payload[field] === undefined || payload[field] === '');
    if (missing.length) {
      next(
        new AppError('Missing required fields', 400, {
          code: 'MISSING_FIELDS',
          details: { missing },
        }),
      );
      return;
    }
    next();
  };
}

export default validate;
