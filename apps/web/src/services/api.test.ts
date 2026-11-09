import { describe, expect, it } from 'vitest';
import { getExplorer, getProject, getUnit, NotFoundError, searchProjects } from './api';

describe('api (fallback mode)', () => {
  it('returns a whole project with every tower, marked as fallback', async () => {
    const r = await getExplorer(1);
    expect(r.source).toBe('fallback');
    expect(r.data.buildings.map((b) => b.building_code)).toEqual(['A', 'B']);
    expect(r.data.units).toHaveLength(624);
    expect(r.data.units[0].floor_number).toBeGreaterThan(0);
  });

  it('searches projects with the shared rules', async () => {
    const all = await searchProjects();
    expect(all.source).toBe('fallback');
    expect(all.data.items.map((p) => p.id)).toEqual([1, 2, 3, 4, 5]);
    expect((await searchProjects({ q: 'อารีย์' })).data.items.map((p) => p.id)).toEqual([1]);
  });

  it('returns a project detail', async () => {
    const r = await getProject(1);
    expect(r.data.buildings).toHaveLength(2);
    expect(r.data.amenities.length).toBeGreaterThan(0);
  });

  it('returns a unit with its building and room images', async () => {
    const r = await getUnit(1);
    expect(r.data.unit.unit_number).toBe('A-701');
    expect(r.data.building.id).toBe(r.data.unit.building_id);
    expect(r.data.images.every((i) => i.unit_type === r.data.unit.unit_type)).toBe(true);
  });

  it('rejects unknown ids with NotFoundError', async () => {
    await expect(getUnit(999999)).rejects.toBeInstanceOf(NotFoundError);
    await expect(getExplorer(999999)).rejects.toBeInstanceOf(NotFoundError);
    await expect(getProject(999999)).rejects.toBeInstanceOf(NotFoundError);
    await expect(getUnit(Number.NaN)).rejects.toBeInstanceOf(NotFoundError);
  });
});
