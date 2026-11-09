import {
  buildBuildingFloors, buildBuildingUnits, buildExplorer, buildProjectBuildings, buildProjectDetail, buildUnitDetail,
  buildUnitFloorPlan, buildUnitImages, generate, mulberry32, searchProjectsLocal, type ProjectSearchParams,
} from '@condoscope/shared';
import { env } from 'cloudflare:workers';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  escapeLike, getBuildingFloors, getBuildingUnits, getExplorer, getProjectBuildings, getProjectDetail, getUnitDetail, getUnitFloorPlan,
  getUnitImages, searchProjects,
} from '../src/services/queries';
import { countingDb, seedDb } from './helpers';

const d = generate();
beforeAll(() => seedDb(env.DB));

const CASES: ProjectSearchParams[] = [
  {}, { q: 'ari' }, { q: 'อารีย์' }, { q: '%' }, { q: '_' }, { q: '\\' }, { q: "'" }, { q: '"; DROP TABLE units;--' }, { q: '   ' },
  { province: 'นนทบุรี' }, { district: 'พญาไท' }, { minPrice: 4_000_000, maxPrice: 9_000_000 }, { bedrooms: 0 }, { bedrooms: 1 }, { bedrooms: 2 },
  { sort: 'price_asc' }, { sort: 'price_desc' }, { sort: 'newest' }, { limit: 2, offset: 1 }, { limit: 50, offset: 100 },
  { q: 'a', province: 'กรุงเทพมหานคร', bedrooms: 1, sort: 'newest', limit: 1 },
];

describe('searchProjects matches searchProjectsLocal', () => {
  it.each(CASES)('%j', async (p) => {
    expect(await searchProjects(env.DB, p)).toEqual(searchProjectsLocal(d, p));
  });

  it('dangerous input leaves the data intact', async () => {
    await searchProjects(env.DB, { q: '"; DROP TABLE units;--' });
    expect((await env.DB.prepare('SELECT COUNT(*) AS n FROM units').first<{ n: number }>())!.n).toBe(d.units.length);
  });
});

describe('project queries match the shared builders', () => {
  it.each([1, 2, 3, 4, 5])('project %i: explorer, detail and buildings', async (id) => {
    expect(await getExplorer(env.DB, id)).toEqual(buildExplorer(d, id));
    expect(await getProjectDetail(env.DB, id)).toEqual(buildProjectDetail(d, id));
    expect(await getProjectBuildings(env.DB, id)).toEqual(buildProjectBuildings(d, id));
  });
});

describe('unit and building queries match the shared builders', () => {
  const rng = mulberry32(2026);
  const sample = [1, d.units.length, ...Array.from({ length: 25 }, () => 1 + Math.floor(rng() * d.units.length))];

  it.each(sample)('unit %i: detail, images, floor plan', async (id) => {
    expect(await getUnitDetail(env.DB, id)).toEqual(buildUnitDetail(d, id));
    expect(await getUnitImages(env.DB, id)).toEqual(buildUnitImages(d, id));
    expect(await getUnitFloorPlan(env.DB, id)).toEqual(buildUnitFloorPlan(d, id));
  });

  it.each([1, 2, 6])('building %i: floors and units with every filter combination', async (id) => {
    expect(await getBuildingFloors(env.DB, id)).toEqual(buildBuildingFloors(d, id));
    for (const f of [undefined, { floor: 18 }, { status: 'available' as const }, { floor: 12, status: 'sold' as const }, { floor: 999 }]) {
      expect(await getBuildingUnits(env.DB, id, f)).toEqual(buildBuildingUnits(d, id, f));
    }
  });
});

describe('missing ids', () => {
  it('every lookup returns null for an id that does not exist', async () => {
    const id = 999999;
    expect(await getProjectDetail(env.DB, id)).toBeNull();
    expect(await getProjectBuildings(env.DB, id)).toBeNull();
    expect(await getExplorer(env.DB, id)).toBeNull();
    expect(await getBuildingFloors(env.DB, id)).toBeNull();
    expect(await getBuildingUnits(env.DB, id)).toBeNull();
    expect(await getUnitDetail(env.DB, id)).toBeNull();
    expect(await getUnitImages(env.DB, id)).toBeNull();
    expect(await getUnitFloorPlan(env.DB, id)).toBeNull();
  });
});

describe('escapeLike', () => {
  it('escapes backslash, percent and underscore', () => {
    expect(escapeLike('50%_\\')).toBe('50\\%\\_\\\\');
    expect(escapeLike('plain ไทย')).toBe('plain ไทย');
  });
});

describe('statement budget (free tier: 50 queries per request)', () => {
  it('each service function prepares at most 4 statements', async () => {
    const calls: [string, (db: D1Database) => Promise<unknown>][] = [
      ['getExplorer', (db) => getExplorer(db, 1)],
      ['getProjectDetail', (db) => getProjectDetail(db, 1)],
      ['getUnitDetail', (db) => getUnitDetail(db, 1)],
      ['searchProjects', (db) => searchProjects(db, { q: 'a', bedrooms: 1 })],
      ['getBuildingUnits', (db) => getBuildingUnits(db, 1, { floor: 18, status: 'available' })],
    ];
    for (const [name, run] of calls) {
      const { db, prepared } = countingDb(env.DB);
      await run(db);
      expect(prepared(), name).toBeLessThanOrEqual(4);
    }
  });
});
