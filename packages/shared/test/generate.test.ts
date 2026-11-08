import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Dataset, Project } from '../src';
import { generate, UNIT_TYPE_BEDROOMS, unitNumber, unitTypeForArea } from '../src';

const fallbackPath = fileURLToPath(new URL('../../../apps/web/src/data/fallback.json', import.meta.url));
const unitsOf = (d: Dataset, p: Project) => {
  const ids = new Set(d.buildings.filter((b) => b.project_id === p.id).map((b) => b.id));
  return d.units.filter((u) => ids.has(u.building_id));
};

describe('generate', () => {
  const a = generate();

  it('is deterministic', () => {
    expect(generate()).toEqual(a);
  });

  it('has 5 projects, Noventa Ari first and featured with 624 units', () => {
    expect(a.projects).toHaveLength(5);
    expect(a.projects.filter((p) => p.is_featured).map((p) => p.id)).toEqual([1]);
    expect(a.projects[0].name).toBe('Noventa Ari');
    expect(a.buildings.filter((b) => b.project_id === 1).map((b) => [b.id, b.building_code])).toEqual([[1, 'A'], [2, 'B']]);
    expect(unitsOf(a, a.projects[0])).toHaveLength(624);
  });

  it('gives every tower an explorer and a residential floor right above the podium', () => {
    expect(a.buildings.every((b) => b.has_explorer && b.first_res_floor === b.podium_floors + 1 && b.total_floors === b.last_res_floor)).toBe(true);
  });

  it('never places two units in the same slot or with the same number', () => {
    const pos = new Set(a.units.map((u) => `${u.building_id}|${u.floor_id}|${u.facade}|${u.bay_index}`));
    expect(pos.size).toBe(a.units.length);
    const num = new Set(a.units.map((u) => `${u.building_id}|${u.unit_number}`));
    expect(num.size).toBe(a.units.length);
  });

  it('keeps unit fields valid and consistent with unit_type', () => {
    for (const u of a.units) {
      expect(u.price).toBeGreaterThan(0);
      expect(u.area_sqm).toBeGreaterThan(0);
      expect(UNIT_TYPE_BEDROOMS[u.unit_type]).toEqual([u.bedrooms, u.bathrooms]);
    }
  });

  it('mixes unit types and directions in every project', () => {
    for (const p of a.projects) for (const t of ['studio', '1br', '2br'] as const) expect(unitsOf(a, p).some((u) => u.unit_type === t)).toBe(true);
    expect(new Set(a.units.map((u) => u.direction.split(' ')[0])).size).toBeGreaterThanOrEqual(4);
  });

  it('derives project totals from units', () => {
    for (const p of a.projects) {
      const us = unitsOf(a, p);
      expect(p.starting_price).toBe(Math.min(...us.map((u) => u.price)));
      expect(p.total_units).toBe(us.length);
    }
  });

  it('classifies areas and numbers units like the prototype', () => {
    expect(unitTypeForArea(24)).toBe('studio');
    expect(unitTypeForArea(30)).toBe('1br');
    expect(unitTypeForArea(52.5)).toBe('2br');
    expect(unitTypeForArea(70.5)).toBe('2br_plus');
    expect(unitNumber('A', 18, 'front', 4, 6)).toBe('A-1805');
    expect(unitNumber('A', 18, 'back', 0, 6)).toBe('A-1807');
  });

  it('matches the committed fallback.json', () => {
    expect(JSON.parse(readFileSync(fallbackPath, 'utf8'))).toEqual(a);
  });
});

describe('imageFile', () => {
  it('maps rooms to the 17 available images', async () => {
    const { imageFile } = await import('../src');
    expect(imageFile('studio', 'living')).toBe('studio/living');
    expect(imageFile('2br', 'balcony')).toBe('1br/balcony');
    expect(imageFile('2br_plus', 'balcony')).toBe('1br/balcony');
    expect(imageFile('2br', 'bedroom2')).toBe('2br/bedroom');
    const files = new Set(generate().unit_type_images.map((i) => i.image_url));
    expect(files.size).toBe(17);
  });
});
