import { Hono } from 'hono';
import { ApiError } from '../errors';

export const health = new Hono<{ Bindings: Env }>().get('/api/health', async (c) => {
  try {
    await c.env.DB.prepare('SELECT 1').first();
  } catch (err) {
    console.error(err);
    throw new ApiError(503, 'UNAVAILABLE', 'Database unavailable');
  }
  return c.json({ ok: true, db: true }, 200, { 'Cache-Control': 'no-store' });
});
