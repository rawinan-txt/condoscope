import { generate } from '@condoscope/shared';
import { env } from 'cloudflare:workers';
import { beforeAll, describe, expect, it } from 'vitest';
import { seedDb } from './helpers';

const d = generate();
const all = async (sql: string) => (await env.DB.prepare(sql).all<Record<string, unknown>>()).results;
const count = async (table: string) => (await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>())!.n;

beforeAll(() => seedDb(env.DB));

describe('seed round trip: SQL → D1 → rows equal the generator output', () => {
  it('projects', async () => {
    const rows = (await all('SELECT * FROM projects ORDER BY id')).map((r) => ({ ...r, is_featured: r.is_featured === 1 }));
    expect(rows).toEqual(d.projects);
  });

  it('buildings (JSON bays and boolean flags are decoded)', async () => {
    const rows = (await all('SELECT * FROM buildings ORDER BY id')).map((r) => ({
      ...r, has_explorer: r.has_explorer === 1, unit_bay_widths: JSON.parse(r.unit_bay_widths as string),
    }));
    expect(rows).toEqual(d.buildings);
  });

  it('floors, units, amenities, project_amenities, unit_type_images', async () => {
    expect(await all('SELECT * FROM floors ORDER BY id')).toEqual(d.floors);
    expect(await all('SELECT * FROM units ORDER BY id')).toEqual(d.units);
    expect(await all('SELECT * FROM amenities ORDER BY id')).toEqual(d.amenities);
    expect(await all('SELECT * FROM project_amenities ORDER BY project_id, amenity_id')).toEqual(d.project_amenities);
    expect(await all('SELECT * FROM unit_type_images ORDER BY id')).toEqual(d.unit_type_images);
  });

  it('running the seed again leaves the same row counts', async () => {
    const before = [await count('projects'), await count('units'), await count('project_amenities')];
    await seedDb(env.DB);
    expect([await count('projects'), await count('units'), await count('project_amenities')]).toEqual(before);
    expect(before[1]).toBe(d.units.length);
  });
});
