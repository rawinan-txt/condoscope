import type { Amenity, Building, Dataset, Floor, Project, Unit, UnitTypeImage } from './types';

export const ROWS_PER_INSERT = 50;

// `satisfies Record<keyof T, 1>` makes a missing or extra column a compile error when the Dataset types change.
const PROJECT_COLS = {
  id: 1, slug: 1, name: 1, description: 1, province: 1, district: 1, neighborhood: 1, latitude: 1, longitude: 1, address_display: 1,
  thumbnail_url: 1, starting_price: 1, total_floors: 1, total_units: 1, is_featured: 1, created_at: 1,
} satisfies Record<keyof Project, 1>;
const BUILDING_COLS = {
  id: 1, project_id: 1, name: 1, building_code: 1, total_floors: 1, first_res_floor: 1, last_res_floor: 1, podium_floors: 1,
  floor_height_m: 1, footprint_depth_m: 1, corridor_width_m: 1, unit_bay_widths: 1, origin_x_m: 1, origin_z_m: 1, rotation_deg: 1, has_explorer: 1,
} satisfies Record<keyof Building, 1>;
const FLOOR_COLS = { id: 1, building_id: 1, floor_number: 1, floor_label: 1 } satisfies Record<keyof Floor, 1>;
const UNIT_COLS = {
  id: 1, building_id: 1, floor_id: 1, unit_number: 1, unit_type: 1, price: 1, area_sqm: 1, bedrooms: 1, bathrooms: 1, direction: 1,
  status: 1, facade: 1, bay_index: 1, description: 1,
} satisfies Record<keyof Unit, 1>;
const AMENITY_COLS = { id: 1, name: 1, icon: 1 } satisfies Record<keyof Amenity, 1>;
const PROJECT_AMENITY_COLS = { project_id: 1, amenity_id: 1 } satisfies Record<keyof Dataset['project_amenities'][number], 1>;
const IMAGE_COLS = { id: 1, unit_type: 1, room_key: 1, image_url: 1, caption: 1, sort_order: 1 } satisfies Record<keyof UnitTypeImage, 1>;

function literal(v: unknown): string {
  if (v === null) return 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new Error(`cannot write ${v} to SQL`);
    return String(v);
  }
  const text = Array.isArray(v) ? JSON.stringify(v) : String(v);
  // D1Database.exec() splits statements on line breaks, so a break inside a value would corrupt the seed
  if (/[\r\n]/.test(text)) throw new Error('seed values must not contain a line break');
  return `'${text.replace(/'/g, "''")}'`;
}

/**
 * Seed file for D1, in dependency order. Re-runnable: it clears the tables first.
 * One statement per line (see literal()), no BEGIN/COMMIT (D1 does not allow them).
 */
export function datasetToSql(d: Dataset): string {
  const tables: { name: string; cols: string[]; rows: object[] }[] = [
    { name: 'projects', cols: Object.keys(PROJECT_COLS), rows: d.projects },
    { name: 'buildings', cols: Object.keys(BUILDING_COLS), rows: d.buildings },
    { name: 'floors', cols: Object.keys(FLOOR_COLS), rows: d.floors },
    { name: 'units', cols: Object.keys(UNIT_COLS), rows: d.units },
    { name: 'amenities', cols: Object.keys(AMENITY_COLS), rows: d.amenities },
    { name: 'project_amenities', cols: Object.keys(PROJECT_AMENITY_COLS), rows: d.project_amenities },
    { name: 'unit_type_images', cols: Object.keys(IMAGE_COLS), rows: d.unit_type_images },
  ];
  const out = [...tables].reverse().map((t) => `DELETE FROM ${t.name};`);
  for (const t of tables) {
    for (let i = 0; i < t.rows.length; i += ROWS_PER_INSERT) {
      const values = t.rows.slice(i, i + ROWS_PER_INSERT)
        .map((r) => `(${t.cols.map((c) => literal((r as Record<string, unknown>)[c])).join(', ')})`);
      out.push(`INSERT INTO ${t.name} (${t.cols.join(', ')}) VALUES ${values.join(', ')};`);
    }
  }
  return out.join('\n') + '\n';
}
