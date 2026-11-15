import type { Building, Dataset, UnitView } from '@condoscope/shared';
import { describe, expect, it } from 'vitest';
import fallback from '../../data/fallback.json';
import { homeView, projectBounds, towerBox, unitViewGoal } from '../explorer/scene/layout';
import { diveGoal, orbitPose } from './poses';
import { chapterAt, countAt, crossfadeToScene, interiorReveal, litFloors, pickShowcaseUnit } from './timeline';

const data = fallback as unknown as Dataset;
const b: Building = data.buildings.find((x) => x.project_id === 1)!;
const floorNo = new Map(data.floors.map((f) => [f.id, f.floor_number]));
const units: UnitView[] = data.units.filter((u) => u.building_id === b.id).map((u) => ({ ...u, floor_number: floorNo.get(u.floor_id)! }));
const bounds = projectBounds([b]);
const steps = Array.from({ length: 101 }, (_, i) => i / 100);
const dist = (a: number[], c: number[]) => Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]);

describe('chapterAt', () => {
  it('follows the chapter table', () => {
    expect([0, 0.2, 0.5, 0.65, 0.8, 1].map(chapterAt)).toEqual(['hero', 'orbit', 'lights', 'count', 'dive', 'cta']);
  });
  it('only moves forward as p grows', () => {
    const order = ['hero', 'orbit', 'lights', 'count', 'dive', 'cta'];
    const idx = steps.map((p) => order.indexOf(chapterAt(p)));
    expect(idx.every((v, i) => i === 0 || v >= idx[i - 1])).toBe(true);
  });
});

describe('crossfadeToScene', () => {
  it('goes 0 to 1 within the hero chapter and stays 1 after', () => {
    expect(crossfadeToScene(0)).toBe(0);
    expect(crossfadeToScene(0.14)).toBe(1);
    expect(crossfadeToScene(1)).toBe(1);
  });
});

describe('counters', () => {
  it('countAt runs 0..N, never down, ends exactly at N', () => {
    expect(countAt(0, 12)).toBe(0);
    expect(countAt(1, 12)).toBe(12);
    const v = steps.map((p) => countAt(p, 12));
    expect(v.every((x, i) => Number.isInteger(x) && x <= 12 && (i === 0 || x >= v[i - 1]))).toBe(true);
  });
  it('countAt of an empty total is 0 everywhere', () => {
    expect(steps.every((p) => countAt(p, 0) === 0)).toBe(true);
  });
  it('litFloors runs 0..floors, integer, never down', () => {
    const n = b.last_res_floor - b.first_res_floor + 1;
    expect(litFloors(0, b.first_res_floor, b.last_res_floor)).toBe(0);
    expect(litFloors(1, b.first_res_floor, b.last_res_floor)).toBe(n);
    const v = steps.map((p) => litFloors(p, b.first_res_floor, b.last_res_floor));
    expect(v.every((x, i) => Number.isInteger(x) && (i === 0 || x >= v[i - 1]))).toBe(true);
  });
  it('the numbers finish before the dive starts', () => {
    expect(countAt(0.72, 5)).toBe(5);
    expect(litFloors(0.58, 1, 10)).toBe(10);
  });
});

describe('orbitPose', () => {
  const home = homeView(bounds);
  it('starts at the home view', () => {
    const o = orbitPose(bounds, 0);
    expect(dist(o.position, home.position)).toBeLessThan(1e-6);
    expect(o.target).toEqual(home.target);
  });
  it('keeps its distance from the target and stays above the ground', () => {
    const d0 = dist(home.position, home.target);
    for (const p of steps) {
      const o = orbitPose(bounds, p);
      expect(Math.abs(dist(o.position, o.target) - d0) / d0).toBeLessThan(0.01);
      expect(o.position[1]).toBeGreaterThan(0);
    }
  });
  it('a jump gives the same pose as walking there', () => {
    const walked = steps.filter((p) => p <= 0.9).map((p) => orbitPose(bounds, p)).pop()!;
    expect(orbitPose(bounds, 0.9)).toEqual(walked);
  });
});

describe('dive', () => {
  const u = units.find((x) => x.status === 'available')!;
  const from = orbitPose(bounds, 0.6);
  it('ends at the unit view and starts at the given pose', () => {
    const end = diveGoal(b, u, 1, from);
    const goal = unitViewGoal(b, u);
    expect(dist(end.position, goal.position)).toBeLessThan(1e-6);
    expect(dist(end.target, goal.target)).toBeLessThan(1e-6);
    expect(diveGoal(b, u, 0, from)).toEqual(from);
  });
  it('the camera never passes through the tower on its way in', () => {
    const box = towerBox(b);
    for (const u2 of units.filter((x) => x.status === 'available').slice(0, 40)) {
      for (let p = 0.72; p <= 1.0001; p += 0.01) {
        const [x, y, z] = diveGoal(b, u2, p, from).position;
        const inside = x > box.min.x && x < box.max.x && y > box.min.y && y < box.max.y && z > box.min.z && z < box.max.z;
        expect(inside, `unit ${u2.id} at p=${p.toFixed(2)}`).toBe(false);
      }
    }
  });
  it('interiorReveal is 0 until late in the dive, then 1', () => {
    expect(interiorReveal(0.5)).toBe(0);
    expect(interiorReveal(0.72)).toBe(0);
    expect(interiorReveal(1)).toBe(1);
    const v = steps.map(interiorReveal);
    expect(v.every((x, i) => i === 0 || x >= v[i - 1])).toBe(true);
  });
});

describe('pickShowcaseUnit', () => {
  it('is deterministic and picks an available front unit near 60% of the tower', () => {
    const a = pickShowcaseUnit(units, b)!;
    expect(pickShowcaseUnit([...units].reverse(), b)!.id).toBe(a.id);
    expect(a.status).toBe('available');
    expect(a.facade).toBe('front');
    const target = b.first_res_floor + (b.last_res_floor - b.first_res_floor) * 0.6;
    const best = Math.min(...units.filter((x) => x.status === 'available' && x.facade === 'front').map((x) => Math.abs(x.floor_number - target)));
    expect(Math.abs(a.floor_number - target)).toBeLessThanOrEqual(best + 0.5);
  });
  it('never returns a unit that is not available, and null when there is none', () => {
    const none = units.map((x): UnitView => ({ ...x, status: 'sold' }));
    expect(pickShowcaseUnit(none, b)).toBeNull();
    expect(pickShowcaseUnit([], b)).toBeNull();
  });
  it('uses the back facade only when no front unit is available', () => {
    const backOnly = units.map((x): UnitView => (x.facade === 'front' ? { ...x, status: 'sold' } : x));
    const r = pickShowcaseUnit(backOnly, b);
    if (backOnly.some((x) => x.status === 'available')) expect(r?.facade).toBe('back');
  });
});
