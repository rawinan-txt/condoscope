import { datasetToSql, generate } from '@condoscope/shared';
import { env } from 'cloudflare:workers';
import worker from '../src/index';

/** Loads the demo dataset into a migrated D1: the same SQL as database/seeds/seed.sql, built from the shared generator. */
export const seedDb = async (db: D1Database): Promise<void> => {
  await db.exec(datasetToSql(generate()));
};

/** Wraps a D1 binding and counts prepare() calls (guards against N+1 and the 50-queries-per-request free limit). */
export function countingDb(db: D1Database): { db: D1Database; prepared: () => number } {
  let n = 0;
  const wrapped = new Proxy(db, {
    get(target, prop) {
      if (prop === 'prepare') return (sql: string) => { n++; return target.prepare(sql); };
      const v = Reflect.get(target, prop);
      return typeof v === 'function' ? v.bind(target) : v;
    },
  });
  return { db: wrapped, prepared: () => n };
}

/** Calls the Worker's default export (the same `fetch` workerd runs in production) with the test bindings. */
export const call = (path: string, init?: RequestInit): Promise<Response> =>
  Promise.resolve(worker.fetch(new Request(`https://api.test${path}`, init), env));
