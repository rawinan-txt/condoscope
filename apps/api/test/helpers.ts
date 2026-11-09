import { env } from 'cloudflare:workers';
import worker from '../src/index';

/** Calls the Worker's default export (the same `fetch` workerd runs in production) with the test bindings. */
export const call = (path: string, init?: RequestInit): Promise<Response> =>
  Promise.resolve(worker.fetch(new Request(`https://api.test${path}`, init), env));
