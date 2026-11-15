import type { Building, UnitView } from '@condoscope/shared';
import { homeView, unitViewGoal, type Bounds, type Vec3 } from '../explorer/scene/layout';
import { remap, easeInOut } from './scroll';

type Pose = { position: Vec3; target: Vec3 };

/** Where each chapter starts (p, 0..1). The chapters are back to back; the numbers below are the only place that says so. */
export const CHAPTER_START = { hero: 0, orbit: 0.14, lights: 0.4, count: 0.58, dive: 0.72, cta: 0.92 } as const;
export const CHAPTERS = ['hero', 'orbit', 'lights', 'count', 'dive', 'cta'] as const;
export type Chapter = (typeof CHAPTERS)[number];

/** Whole turn the camera makes round the tower, degrees. */
export const ORBIT_DEGREES = 200;
const REVEAL_FROM = 0.84;
const REVEAL_TO = 0.94;

export const chapterAt = (p: number): Chapter => [...CHAPTERS].reverse().find((c) => p >= CHAPTER_START[c]) ?? 'hero';

/** 0 to 1 while the hero picture gives way to the 3D scene (the hero chapter). */
export const crossfadeToScene = (p: number): number => easeInOut(remap(p, 0, CHAPTER_START.orbit));

/** Camera on a circle round the tower: starts at the home view, same distance and height all the way. */
export function orbitPose(b: Bounds, p: number): Pose {
  const home = homeView(b);
  const angle = (ORBIT_DEGREES * Math.PI / 180) * easeInOut(remap(p, CHAPTER_START.orbit, CHAPTER_START.lights));
  const dx = home.position[0] - home.target[0];
  const dz = home.position[2] - home.target[2];
  const c = Math.cos(angle), s = Math.sin(angle);
  return { position: [home.target[0] + dx * c - dz * s, home.position[1], home.target[2] + dx * s + dz * c], target: home.target };
}

/** How many floors (of first..last) are lit: whole numbers, 0 before the chapter and all of them when it ends. */
export const litFloors = (p: number, firstFloor: number, lastFloor: number): number =>
  Math.floor((lastFloor - firstFloor + 1) * remap(p, CHAPTER_START.lights, CHAPTER_START.count));

/** The counter: whole numbers 0..total, exactly total when the count chapter ends. */
export const countAt = (p: number, total: number): number => Math.floor(total * easeInOut(remap(p, CHAPTER_START.count, CHAPTER_START.dive)));

const mix = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** From the given pose (the end of the orbit) to the close view of the unit. */
export function diveGoal(b: Building, u: UnitView, p: number, from: Pose): Pose {
  const t = easeInOut(remap(p, CHAPTER_START.dive, CHAPTER_START.cta));
  const to = unitViewGoal(b, u);
  return { position: mix(from.position, to.position, t), target: mix(from.target, to.target, t) };
}

/** 0 to 1 near the end of the dive: the picture of the room opens. */
export const interiorReveal = (p: number): number => easeInOut(remap(p, REVEAL_FROM, REVEAL_TO));

/** The room the story flies to: an available front unit close to 60% of the tower height (back facade only if no front unit is free); ties go to the lowest id. */
export function pickShowcaseUnit(units: UnitView[], b: Building): UnitView | null {
  const free = units.filter((u) => u.status === 'available');
  const front = free.filter((u) => u.facade === 'front');
  const pool = front.length ? front : free;
  const target = b.first_res_floor + (b.last_res_floor - b.first_res_floor) * 0.6;
  let best: UnitView | null = null;
  for (const u of pool) {
    const d = Math.abs(u.floor_number - target);
    const bd = best ? Math.abs(best.floor_number - target) : Infinity;
    if (d < bd || (d === bd && u.id < best!.id)) best = u;
  }
  return best;
}
