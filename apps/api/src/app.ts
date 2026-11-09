import { Hono } from 'hono';
import { notFound, onError } from './errors';
import { health } from './routes/health';

export function createApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.onError(onError);
  app.notFound(notFound);
  app.route('/', health);
  return app;
}
