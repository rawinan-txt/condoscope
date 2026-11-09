import { describe, expect, it } from 'vitest';
import type { Dataset, ProjectSearchParams } from '../src';
import {
  buildBuildingFloors, buildBuildingUnits, buildExplorer, buildProjectBuildings, buildProjectDetail, buildUnitDetail,
  buildUnitFloorPlan, buildUnitImages, generate, searchProjectsLocal,
} from '../src';

const d: Dataset = generate();
const ids = (p: ProjectSearchParams) => searchProjectsLocal(d, p).items.map((x) => x.id);
const projectOfBuilding = (id: number) => d.buildings.find((b) => b.id === id)!.project_id;

/** Independent expectation: projects with at least one available unit that has `bedrooms` bedrooms. */
function withAvailableBedrooms(bedrooms: number): number[] {
  const found = new Set<number>();
  for (const u of d.units) if (u.status === 'available' && u.bedrooms === bedrooms) found.add(projectOfBuilding(u.building_id));
  return [...found].sort((a, b) => a - b);
}

describe('searchProjectsLocal', () => {
  it('no conditions: 5 projects in recommended order', () => {
    const r = searchProjectsLocal(d, {});
    expect(r.items.map((p) => p.id)).toEqual([1, 2, 3, 4, 5]);
    expect(r).toMatchObject({ total: 5, limit: 20, offset: 0 });
  });

  it('q ignores ASCII case and finds Thai', () => {
    expect(ids({ q: 'noventa' })).toEqual([1]);
    expect(ids({ q: 'อารีย์' })).toEqual([1]);
    expect(ids({ q: '  ARI ' })).toEqual([1, 5]); // substring: Noventa Ari and M-ari-vo; also proves trimming + case folding
  });

  it('special characters are plain characters, not wildcards', () => {
    for (const q of ['%', '_', '\\', "'", '"; DROP TABLE units;--']) expect(ids({ q })).toEqual([]);
  });

  it('q that is blank after trimming means no filter', () => {
    expect(ids({ q: '   ' })).toHaveLength(5);
  });

  it('province, district and price on starting_price', () => {
    expect(ids({ province: 'นนทบุรี' })).toEqual([3]);
    expect(ids({ district: 'พญาไท' })).toEqual([1]);
    const p1 = d.projects[0].starting_price;
    expect(ids({ minPrice: p1, maxPrice: p1 })).toContain(1);
    expect(ids({ maxPrice: Math.min(...d.projects.map((p) => p.starting_price)) - 1 })).toEqual([]);
  });

  it('bedrooms means the project has an available unit with that many bedrooms', () => {
    for (const b of [0, 1, 2] as const) expect(ids({ bedrooms: b }).sort((x, y) => x - y)).toEqual(withAvailableBedrooms(b));
  });

  it('sorts and paginates', () => {
    expect(ids({ sort: 'newest' })).toEqual([5, 2, 1, 3, 4]);
    const byPrice = [...d.projects].sort((a, b) => a.starting_price - b.starting_price || a.id - b.id).map((p) => p.id);
    expect(ids({ sort: 'price_asc' })).toEqual(byPrice);
    const desc = [...d.projects].sort((a, b) => b.starting_price - a.starting_price || a.id - b.id).map((p) => p.id);
    expect(ids({ sort: 'price_desc' })).toEqual(desc);
    const page = searchProjectsLocal(d, { limit: 2, offset: 1 });
    expect(page.items.map((p) => p.id)).toEqual([2, 3]);
    expect(page.total).toBe(5);
    expect(searchProjectsLocal(d, { limit: 50, offset: 100 }).items).toEqual([]);
  });
});

describe('payload builders', () => {
  it('explorer of project 1', () => {
    const e = buildExplorer(d, 1)!;
    expect(e.buildings.map((b) => b.building_code)).toEqual(['A', 'B']);
    expect(e.units).toHaveLength(624);
    expect(e.units.every((u, i, a) => i === 0 || a[i - 1].id < u.id)).toBe(true);
    expect(e.units[0].floor_number).toBeGreaterThan(0);
    expect(buildExplorer(d, 999999)).toBeNull();
  });

  it('project detail: buildings, amenities and availability by unit type', () => {
    const x = buildProjectDetail(d, 1)!;
    expect(x.buildings).toHaveLength(2);
    expect(x.amenities.length).toBeGreaterThanOrEqual(4);
    const ids1 = new Set(d.buildings.filter((b) => b.project_id === 1).map((b) => b.id));
    let available = 0;
    for (const u of d.units) if (ids1.has(u.building_id) && u.status === 'available') available++;
    expect(x.availability.reduce((s, a) => s + a.available, 0)).toBe(available);
    for (const a of x.availability) expect(a.available === 0 ? a.min_price === null : a.min_price! > 0).toBe(true);
    expect(buildProjectDetail(d, 999999)).toBeNull();
    expect(buildProjectBuildings(d, 1)).toHaveLength(2);
    expect(buildProjectBuildings(d, 999999)).toBeNull();
  });

  it('unit detail, images and floor plan', () => {
    const u = buildUnitDetail(d, 1)!;
    expect(u.unit.unit_number).toBe('A-701');
    expect(u.images.every((i) => i.unit_type === u.unit.unit_type)).toBe(true);
    expect(u.images.map((i) => i.sort_order)).toEqual([...u.images.map((i) => i.sort_order)].sort((a, b) => a - b));
    expect(buildUnitImages(d, 1)).toEqual(u.images);
    expect(buildUnitFloorPlan(d, 1)!.plan.rooms.length).toBeGreaterThan(0);
    for (const f of [buildUnitDetail, buildUnitImages, buildUnitFloorPlan]) expect(f(d, 999999)).toBeNull();
  });

  it('building floors and units with filters', () => {
    const floors = buildBuildingFloors(d, 1)!;
    expect(floors[0].floor_number).toBeGreaterThan(floors[floors.length - 1].floor_number);
    expect(buildBuildingFloors(d, 999999)).toBeNull();
    expect(buildBuildingUnits(d, 1, { floor: 999 })).toEqual([]);
    expect(buildBuildingUnits(d, 1, { status: 'sold' })!.every((u) => u.status === 'sold')).toBe(true);
    expect(buildBuildingUnits(d, 1, { floor: 18 })!.every((u) => u.floor_number === 18)).toBe(true);
    expect(buildBuildingUnits(d, 999999)).toBeNull();
  });
});
