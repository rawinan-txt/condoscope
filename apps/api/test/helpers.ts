import { datasetToSql, generate } from '@condoscope/shared';
import { env } from 'cloudflare:workers';
import worker from '../src/index';

/** Loads the demo dataset into a migrated D1: the same SQL as database/seeds/seed.sql, built from the shared generator. */
export const seedDb = async (db: D1Database): Promise<void> => {
  await db.exec(datasetToSql(generate()));
};

/** Calls the Worker's default export (the same `fetch` workerd runs in production) with the test bindings. */
export const call = (path: string, init?: RequestInit): Promise<Response> =>
  Promise.resolve(worker.fetch(new Request(`https://api.test${path}`, init), env));
