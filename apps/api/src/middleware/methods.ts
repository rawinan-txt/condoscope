import type { ApiErrorBody } from '@condoscope/shared';
import type { MiddlewareHandler } from 'hono';

const READ_ONLY = ['GET', 'HEAD', 'OPTIONS'];

/** The API has no write endpoints (spec section 7); anything else is refused before it reaches a route. */
export const readOnly: MiddlewareHandler = async (c, next) => {
  if (READ_ONLY.includes(c.req.method)) return next();
  const body: ApiErrorBody = { error: { code: 'METHOD_NOT_ALLOWED', message: 'This API is read-only' } };
  return c.json(body, 405, { Allow: READ_ONLY.join(', '), 'Cache-Control': 'no-store' });
};
