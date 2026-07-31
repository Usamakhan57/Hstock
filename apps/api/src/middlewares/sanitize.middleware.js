import mongoSanitize from 'express-mongo-sanitize';

/**
 * Strip keys that start with `$` or contain `.` to mitigate NoSQL injection.
 */
export const sanitizeRequest = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    req.sanitizedKeys = req.sanitizedKeys || [];
    req.sanitizedKeys.push(key);
  },
});

export default sanitizeRequest;
