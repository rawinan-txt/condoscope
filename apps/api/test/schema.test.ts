import { applyD1Migrations } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';

type Row = Record<string, string | number | null>;

/** Insert one row; keys are fixed test constants, every value goes through a bound parameter. */
async function insert(table: string, row: Row) {
  const cols = Object.keys(row);
  const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
  return env.DB.prepare(sql).bind(...Object.values(row)).run();
}

const project = (o: Row = {}): Row => ({
  id: 1, slug: 'p-1', name: 'P', description: 'd', province: 'กรุงเทพมหานคร', district: 'พญาไท', neighborhood: 'อารีย์',
  latitude: 13.78, longitude: 100.54, address_display: 'a', thumbnail_url: null, starting_price: 2_000_000,
  total_floors: 10, total_units: 1, is_featured: 0, created_at: '2026-01-01T00:00:00Z', ...o,
});
const building = (o: Row = {}): Row => ({
  id: 1, project_id: 1, name: 'อาคาร A', building_code: 'A', total_floors: 10, first_res_floor: 2, last_res_floor: 10, podium_floors: 1,
  floor_height_m: 3.2, footprint_depth_m: 17, corridor_width_m: 2, unit_bay_widths: '[4,4]', origin_x_m: 0, origin_z_m: 0,
  rotation_deg: 0, has_explorer: 1, ...o,
});
const floor = (o: Row = {}): Row => ({ id: 1, building_id: 1, floor_number: 2, floor_label: 'ชั้น 2', ...o });
const unit = (o: Row = {}): Row => ({
  id: 1, building_id: 1, floor_id: 1, unit_number: 'A-201', unit_type: 'studio', price: 2_000_000, area_sqm: 24, bedrooms: 0,
  bathrooms: 1, direction: 'ทิศใต้', status: 'available', facade: 'front', bay_index: 0, description: 'd', ...o,
});

async function chain() {
  await insert('projects', project());
  await insert('buildings', building());
  await insert('floors', floor());
}

beforeEach(async () => {
  for (const t of ['unit_type_images', 'project_amenities', 'amenities', 'units', 'floors', 'buildings', 'projects']) {
    await env.DB.prepare(`DELETE FROM ${t}`).run();
  }
});

describe('schema', () => {
  it('accepts a valid project → building → floor → unit chain', async () => {
    await chain();
    await insert('units', unit());
    expect((await env.DB.prepare('SELECT COUNT(*) AS n FROM units').first<{ n: number }>())!.n).toBe(1);
  });

  it('rejects a second unit in the same slot (building, floor, facade, bay)', async () => {
    await chain();
    await insert('units', unit());
    await expect(insert('units', unit({ id: 2, unit_number: 'A-202' }))).rejects.toThrow();
  });

  it('rejects a duplicate unit_number inside one building but allows it across buildings', async () => {
    await chain();
    await insert('units', unit());
    await expect(insert('units', unit({ id: 2, bay_index: 1 }))).rejects.toThrow();
    await insert('buildings', building({ id: 2, building_code: 'B' }));
    await insert('floors', floor({ id: 2, building_id: 2 }));
    await insert('units', unit({ id: 3, building_id: 2, floor_id: 2 }));
  });

  it.each([['status', 'bogus'], ['facade', 'left'], ['area_sqm', 0], ['price', 0]] as const)('CHECK on %s=%s rejects the row', async (col, val) => {
    await chain();
    await expect(insert('units', unit({ [col]: val }))).rejects.toThrow();
  });

  it('enforces foreign keys', async () => {
    await expect(insert('units', unit({ building_id: 999, floor_id: 999 }))).rejects.toThrow();
  });

  it('does not restrict unit_type, so new types (spec section 14) need no table rebuild', async () => {
    await chain();
    await insert('units', unit({ unit_type: 'penthouse' }));
  });

  it('buildings reject invalid JSON bays and reversed floors', async () => {
    await insert('projects', project());
    await expect(insert('buildings', building({ unit_bay_widths: 'not json' }))).rejects.toThrow();
    await expect(insert('buildings', building({ first_res_floor: 11, last_res_floor: 10 }))).rejects.toThrow();
  });

  it('has the indexes the spec asks for', async () => {
    const names = (await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all<{ name: string }>()).results.map((r) => r.name);
    expect(names).toEqual(expect.arrayContaining(['idx_projects_province_price', 'idx_units_building_floor', 'idx_units_building_status']));
  });

  it('applying the migrations twice is harmless', async () => {
    await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  });
});
