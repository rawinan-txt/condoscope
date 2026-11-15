import type { Building, Dataset, UnitView } from '@condoscope/shared';
import { describe, expect, it } from 'vitest';
import fallback from '../../data/fallback.json';
import { projectBounds, towerBox, unitViewGoal } from '../explorer/scene/layout';
import { diveGoal, orbitPose, scenePose } from './poses';
import { CHAPTER_START, chapterAt, countAt, interiorReveal, litFloors, orbitDegrees, pickShowcaseUnit, sceneAt, searchOpacity } from './timeline';

const data = fallback as unknown as Dataset;
const b: Building = data.buildings.find((x) => x.project_id === 1)!;
const floorNo = new Map(data.floors.map((f) => [f.id, f.floor_number]));
const units: UnitView[] = data.units.filter((u) => u.building_id === b.id).map((u) => ({ ...u, floor_number: floorNo.get(u.floor_id)! }));
const bounds = projectBounds([b]);
const steps = Array.from({ length: 101 }, (_, i) => i / 100);
const dist = (a: number[], c: number[]) => Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]);
const up = (v: number[]) => v.every((x, i) => i === 0 || x >= v[i - 1]);

describe('chapters and scenes', () => {
  it('follow the table and only move forward', () => {
    expect([0, 0.2, 0.35, 0.5, 0.8, 1].map(chapterAt)).toEqual(['search', 'filter', 'map', 'tower', 'plan', 'reserve']);
    const order = ['search', 'filter', 'map', 'tower', 'plan', 'reserve'];
    expect(up(steps.map((p) => order.indexOf(chapterAt(p))))).toBe(true);
    expect(chapterAt(CHAPTER_START.tower)).toBe('tower');
  });
  it('the three towers come one after another', () => {
    expect([0, 0.41, 0.42, 0.67, 0.68, 1].map(sceneAt)).toEqual([0, 0, 1, 1, 2, 2]);
    expect(up(steps.map(sceneAt))).toBe(true);
  });
  it('the search box is fully there on the first screen and gone before the second chapter', () => {
    expect(searchOpacity(0)).toBe(1);
    expect(searchOpacity(CHAPTER_START.filter)).toBe(0);
    expect(up(steps.map((p) => -searchOpacity(p)))).toBe(true);
  });
});

describe('counters', () => {
  it('countAt runs 0..N, never down, ends exactly at N', () => {
    expect(countAt(0, 12)).toBe(0);
    expect(countAt(1, 12)).toBe(12);
    const v = steps.map((p) => countAt(p, 12));
    expect(v.every((x) => Number.isInteger(x) && x <= 12) && up(v)).toBe(true);
  });
  it('an empty total is 0 everywhere', () => expect(steps.every((p) => countAt(p, 0) === 0)).toBe(true));
  it('litFloors runs 0..floors, integer, never down', () => {
    const n = b.last_res_floor - b.first_res_floor + 1;
    expect(litFloors(0, b.first_res_floor, b.last_res_floor)).toBe(0);
    expect(litFloors(1, b.first_res_floor, b.last_res_floor)).toBe(n);
    const v = steps.map((p) => litFloors(p, b.first_res_floor, b.last_res_floor));
    expect(v.every((x) => Number.isInteger(x)) && up(v)).toBe(true);
  });
  it('the counter and the lights finish before the flight into the room', () => {
    expect(countAt(CHAPTER_START.plan, 5)).toBe(5);
    expect(litFloors(CHAPTER_START.plan, 1, 10)).toBe(10);
  });
});

describe('camera', () => {
  it('the orbit starts at 0 degrees, grows within a tower and restarts for the next one', () => {
    expect(orbitDegrees(0)).toBe(0);
    expect(up(steps.filter((p) => p < CHAPTER_START.tower).map(orbitDegrees))).toBe(true);
    expect(orbitDegrees(CHAPTER_START.tower)).toBe(0);
    expect(up(steps.filter((p) => p >= CHAPTER_START.tower && p < CHAPTER_START.plan).map(orbitDegrees))).toBe(true);
  });
  it('orbitPose keeps its distance and stays above the ground', () => {
    const d0 = dist(orbitPose(bounds, 0).position, orbitPose(bounds, 0).target);
    for (const deg of [0, 45, 120, 200]) {
      const o = orbitPose(bounds, deg);
      expect(Math.abs(dist(o.position, o.target) - d0) / d0).toBeLessThan(0.01);
      expect(o.position[1]).toBeGreaterThan(0);
    }
  });
  it('a jump gives the same pose as walking there', () => {
    const walked = steps.filter((p) => p <= 0.3).map((p) => scenePose(0, bounds, null, p)).pop()!;
    expect(scenePose(0, bounds, null, 0.3)).toEqual(walked);
  });
});

describe('the flight into the room', () => {
  const u = units.find((x) => x.status === 'available')!;
  const from = orbitPose(bounds, 0);
  const target = { building: b, unit: u };
  it('starts at the given pose and ends at the unit view', () => {
    expect(diveGoal(b, u, CHAPTER_START.plan, from)).toEqual(from);
    const end = diveGoal(b, u, CHAPTER_START.reserve, from);
    const goal = unitViewGoal(b, u);
    expect(dist(end.position, goal.position) + dist(end.target, goal.target)).toBeLessThan(1e-6);
  });
  it('scene 2 without a target only holds the home view', () => {
    expect(scenePose(2, bounds, null, 0.9)).toEqual(orbitPose(bounds, 0));
    expect(scenePose(2, bounds, target, 0.9).position).toEqual(unitViewGoal(b, u).position);
  });
  it('the camera never passes through the tower on its way in', () => {
    const box = towerBox(b);
    for (const u2 of units.filter((x) => x.status === 'available').slice(0, 40)) {
      for (let p = CHAPTER_START.plan; p <= 1.0001; p += 0.01) {
        const [x, y, z] = diveGoal(b, u2, p, from).position;
        const inside = x > box.min.x && x < box.max.x && y > box.min.y && y < box.max.y && z > box.min.z && z < box.max.z;
        expect(inside, `unit ${u2.id} at p=${p.toFixed(2)}`).toBe(false);
      }
    }
  });
  it('interiorReveal is 0 until late in the flight, then 1, never down', () => {
    expect(interiorReveal(0.5)).toBe(0);
    expect(interiorReveal(CHAPTER_START.reserve)).toBe(1);
    expect(up(steps.map(interiorReveal))).toBe(true);
  });
});

describe('pickShowcaseUnit', () => {
  it('is deterministic and picks an available front unit near 60% of the tower', () => {
    const a = pickShowcaseUnit(units, b)!;
    expect(pickShowcaseUnit([...units].reverse(), b)!.id).toBe(a.id);
    expect(a.status).toBe('available');
    expect(a.facade).toBe('front');
  });
  it('never returns a unit that is not available, and null when there is none', () => {
    expect(pickShowcaseUnit(units.map((x): UnitView => ({ ...x, status: 'sold' })), b)).toBeNull();
    expect(pickShowcaseUnit([], b)).toBeNull();
  });
});
