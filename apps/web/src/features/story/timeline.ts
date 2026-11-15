import type { Building, UnitView } from '@condoscope/shared';
import { remap, easeInOut } from './scroll';

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

/** How many floors (of first..last) are lit: whole numbers, 0 before the chapter and all of them when it ends. */
export const litFloors = (p: number, firstFloor: number, lastFloor: number): number =>
  Math.floor((lastFloor - firstFloor + 1) * remap(p, CHAPTER_START.lights, CHAPTER_START.count));

/** The counter: whole numbers 0..total, exactly total when the count chapter ends. */
export const countAt = (p: number, total: number): number => Math.floor(total * easeInOut(remap(p, CHAPTER_START.count, CHAPTER_START.dive)));

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
