import type { ApiErrorBody, ApiErrorCode } from '@condoscope/shared';
import type { ErrorHandler, NotFoundHandler } from 'hono';

export class ApiError extends Error {
  constructor(readonly status: 400 | 404 | 405 | 500 | 503, readonly code: ApiErrorCode, message: string) {
    super(message);
  }
}

/** Unwraps a lookup result or answers 404 for a well-formed id that does not exist. */
export function found<T>(value: T | null, what: string): T {
  if (value === null) throw new ApiError(404, 'NOT_FOUND', `${what} not found`);
  return value;
}

const body = (code: ApiErrorCode, message: string): ApiErrorBody => ({ error: { code, message } });
const NO_STORE = { 'Cache-Control': 'no-store' };

export const onError: ErrorHandler<{ Bindings: Env }> = (err, c) => {
  if (err instanceof ApiError) return c.json(body(err.code, err.message), err.status, NO_STORE);
  console.error(err); // details stay in the Worker log, never in the response
  return c.json(body('INTERNAL', 'Internal server error'), 500, NO_STORE);
};

export const notFound: NotFoundHandler<{ Bindings: Env }> = (c) =>
  c.json(body('NOT_FOUND', 'Route not found'), 404, NO_STORE);
