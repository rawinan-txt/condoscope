import { Hono } from 'hono';
import { notFound, onError } from './errors';
import { buildings } from './routes/buildings';
import { health } from './routes/health';
import { projects } from './routes/projects';
import { units } from './routes/units';

export function createApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.onError(onError);
  app.notFound(notFound);
  app.route('/', health);
  app.route('/', projects);
  app.route('/', buildings);
  app.route('/', units);
  return app;
}
