import { cors as honoCors } from 'hono/cors';
import type { MiddlewareHandler } from 'hono';

/** Dev servers and previews: plain http on localhost / 127.0.0.1, any port. Whole-string match, so localhost.evil.com fails. */
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:[0-9]{1,5})?$/;

export const parseAllowedOrigins = (v: string | undefined): string[] =>
  (v ?? '').split(',').map((s) => s.trim()).filter(Boolean);

export const isAllowedOrigin = (origin: string, extra: string[]): boolean =>
  extra.includes(origin) || (LOCAL_ORIGIN.test(origin) && Number(origin.split(':')[2] ?? 0) <= 65535);

/** Read-only API: GET/HEAD/OPTIONS, no credentials. The origin list comes from the ALLOWED_ORIGINS var of the Worker. */
export const cors: MiddlewareHandler<{ Bindings: Env }> = (c, next) =>
  honoCors({
    origin: (origin) => (isAllowedOrigin(origin, parseAllowedOrigins(c.env.ALLOWED_ORIGINS)) ? origin : null),
    allowMethods: ['GET', 'HEAD', 'OPTIONS'],
    maxAge: 86400,
  })(c, next);
