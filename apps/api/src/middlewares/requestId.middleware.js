import { randomUUID } from 'node:crypto';

export function requestIdMiddleware(req, res, next) {
  const headerId = req.headers['x-request-id'];
  const requestId = typeof headerId === 'string' && headerId.trim()
    ? headerId.trim()
    : randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}

export default requestIdMiddleware;
