import { Hono } from 'hono';
import { notFound, onError } from './errors';
import { cache } from './middleware/cache';
import { cors } from './middleware/cors';
import { readOnly } from './middleware/methods';
import { buildings } from './routes/buildings';
import { health } from './routes/health';
import { projects } from './routes/projects';
import { units } from './routes/units';

export function createApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.onError(onError);
  app.notFound(notFound);
  app.use('*', async (c, next) => {
    await next();
    c.res.headers.set('X-Content-Type-Options', 'nosniff');
  });
  app.use('/api/*', readOnly, cors, cache);
  app.route('/', health);
  app.route('/', projects);
  app.route('/', buildings);
  app.route('/', units);
  return app;
}
