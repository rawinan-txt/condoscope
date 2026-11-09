import {
  buildBuildingFloors, buildBuildingUnits, buildExplorer, buildProjectBuildings, buildProjectDetail, buildUnitDetail, buildUnitFloorPlan,
  buildUnitImages, generate, searchProjectsLocal, type ApiErrorBody,
} from '@condoscope/shared';
import { env } from 'cloudflare:workers';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { call, seedDb } from './helpers';

const d = generate();
beforeAll(() => seedDb(env.DB));
const json = async (path: string) => (await call(path)).json();
const count = async (t: string) => (await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${t}`).first<{ n: number }>())!.n;

describe('every endpoint answers exactly what the shared builders produce', () => {
  it('projects, search and project detail', async () => {
    expect(await json('/api/projects')).toEqual(searchProjectsLocal(d, {}));
    expect(await json('/api/projects?q=%E0%B8%AD%E0%B8%B2%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B9%8C&sort=newest')).toEqual(searchProjectsLocal(d, { q: 'อารีย์', sort: 'newest' }));
    expect(await json('/api/projects?bedrooms=1&maxPrice=9000000&limit=2&offset=0')).toEqual(searchProjectsLocal(d, { bedrooms: 1, maxPrice: 9_000_000, limit: 2, offset: 0 }));
    for (const id of [1, 2, 3, 4, 5]) {
      expect(await json(`/api/projects/${id}`)).toEqual(buildProjectDetail(d, id));
      expect(await json(`/api/projects/${id}/buildings`)).toEqual(buildProjectBuildings(d, id));
      expect(await json(`/api/projects/${id}/explorer`)).toEqual(buildExplorer(d, id));
    }
  });

  it('buildings, units, images and floor plans', async () => {
    expect(await json('/api/buildings/1/floors')).toEqual(buildBuildingFloors(d, 1));
    expect(await json('/api/buildings/1/units')).toEqual(buildBuildingUnits(d, 1));
    expect(await json('/api/buildings/1/units?floor=18&status=available')).toEqual(buildBuildingUnits(d, 1, { floor: 18, status: 'available' }));
    for (const id of [1, 300, d.units.length]) {
      expect(await json(`/api/units/${id}`)).toEqual(buildUnitDetail(d, id));
      expect(await json(`/api/units/${id}/images`)).toEqual(buildUnitImages(d, id));
      expect(await json(`/api/units/${id}/floor-plan`)).toEqual(buildUnitFloorPlan(d, id));
    }
  });

  it('answers 200 with application/json', async () => {
    const r = await call('/api/projects/1');
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toContain('application/json');
  });
});

describe('malformed ids and parameters → 400 in the single error format, never 500', () => {
  const BAD_IDS = ['abc', '0', '-1', '1.5', '1e3', '99999999999999999999'];
  const PATHS = [
    ...BAD_IDS.flatMap((id) => [`/api/units/${id}`, `/api/units/${id}/images`, `/api/projects/${id}`, `/api/projects/${id}/explorer`, `/api/buildings/${id}/units`]),
    '/api/projects?minPrice=5000000&maxPrice=1000000', '/api/projects?minPrice=-1', '/api/projects?limit=0', '/api/projects?limit=51',
    '/api/projects?bedrooms=3', '/api/projects?sort=hax', `/api/projects?q=${'x'.repeat(101)}`,
    '/api/buildings/1/units?status=SOLD', '/api/buildings/1/units?floor=abc',
  ];
  it.each(PATHS)('%s', async (path) => {
    const r = await call(path);
    expect(r.status).toBe(400);
    expect(((await r.json()) as ApiErrorBody).error.code).toBe('VALIDATION_ERROR');
  });
});

describe('well-formed but missing → 404; empty filter result → 200', () => {
  it.each(['/api/units/999999', '/api/units/999999/images', '/api/units/999999/floor-plan', '/api/projects/999999', '/api/projects/999999/buildings',
    '/api/projects/999999/explorer', '/api/buildings/999999/floors', '/api/buildings/999999/units'])('%s → 404 NOT_FOUND', async (path) => {
    const r = await call(path);
    expect(r.status).toBe(404);
    expect(((await r.json()) as ApiErrorBody).error.code).toBe('NOT_FOUND');
  });

  it('a filter that matches nothing is an empty list, not an error', async () => {
    const r = await call('/api/buildings/1/units?floor=999');
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual([]);
    expect((await json('/api/projects?province=%E0%B9%84%E0%B8%A1%E0%B9%88%E0%B8%A1%E0%B8%B5') as { total: number }).total).toBe(0);
  });
});

describe('hostile search text', () => {
  const HOSTILE = ['%', '_', '\\', "'", '"', '"; DROP TABLE units;--', "' OR '1'='1", '%25', '😀', 'ก'.repeat(100)];
  it.each(HOSTILE)('q=%s is matched literally: 200, no match, data intact', async (q) => {
    const r = await call(`/api/projects?q=${encodeURIComponent(q)}`);
    expect(r.status).toBe(200);
    expect(((await r.json()) as { items: unknown[] }).items).toEqual([]);
    expect(await count('units')).toBe(d.units.length);
    expect(await count('projects')).toBe(d.projects.length);
  });
});

describe('route table', () => {
  it('has exactly the GET routes of the spec: no /views, no write routes', () => {
    const get = createApp().routes.filter((r) => r.method === 'GET').map((r) => r.path).sort();
    expect(get).toEqual([
      '/api/buildings/:id/floors', '/api/buildings/:id/units', '/api/health', '/api/projects', '/api/projects/:id',
      '/api/projects/:id/buildings', '/api/projects/:id/explorer', '/api/units/:id', '/api/units/:id/floor-plan', '/api/units/:id/images',
    ]);
    expect(createApp().routes.filter((r) => !['GET', 'ALL'].includes(r.method))).toEqual([]);
  });
});
