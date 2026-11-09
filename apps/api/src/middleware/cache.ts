import type { MiddlewareHandler } from 'hono';

// The mock data only changes when the seed is re-run, so browsers may keep it 5 minutes and shared caches 1 hour.
// This is also what keeps the explorer (700-1,400 rows read per call) inside the D1 free quota.
export const PUBLIC_CACHE = 'public, max-age=300, s-maxage=3600';

/** Public GET answers are cacheable; health and every error already say no-store themselves (see errors.ts, routes/health.ts). */
export const cache: MiddlewareHandler = async (c, next) => {
  await next();
  if (c.req.method === 'GET' && c.res.status === 200 && !c.res.headers.has('Cache-Control')) c.res.headers.set('Cache-Control', PUBLIC_CACHE);
};
