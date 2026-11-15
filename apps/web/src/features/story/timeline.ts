import type { Building, UnitView } from '@condoscope/shared';
import { easeInOut, remap } from './scroll';

/**
 * The story introduces the whole system, one chapter after another. Where each chapter starts (p, 0..1) is only written here.
 * welcome = the first screen (a tower, no search box: this is the intro for a first visit) · filter · map · tower (floors light up, the total counts) · plan (fly into a room) · reserve.
 */
export const CHAPTER_START = { welcome: 0, filter: 0.1, map: 0.28, tower: 0.42, plan: 0.68, reserve: 0.88 } as const;
export const CHAPTERS = ['welcome', 'filter', 'map', 'tower', 'plan', 'reserve'] as const;
export type Chapter = (typeof CHAPTERS)[number];

export const chapterAt = (p: number): Chapter => [...CHAPTERS].reverse().find((c) => p >= CHAPTER_START[c]) ?? 'welcome';

/** The story shows three towers from three projects, one per stretch: 0 until the tower chapter, 1 through it, 2 for the flight into a room. */
export const sceneAt = (p: number): 0 | 1 | 2 => (p < CHAPTER_START.tower ? 0 : p < CHAPTER_START.plan ? 1 : 2);

/** How far the camera has gone round the current tower, degrees. */
export const ORBIT_FIRST = 200;
export const ORBIT_SECOND = 70;
export function orbitDegrees(p: number): number {
  if (p < CHAPTER_START.tower) return ORBIT_FIRST * easeInOut(remap(p, CHAPTER_START.filter, CHAPTER_START.tower));
  if (p < CHAPTER_START.plan) return ORBIT_SECOND * easeInOut(remap(p, CHAPTER_START.tower, CHAPTER_START.plan));
  return 0;
}

/** How many floors (of first..last) are lit: whole numbers, 0 before the tower chapter and all of them by 58%. */
export const litFloors = (p: number, firstFloor: number, lastFloor: number): number =>
  Math.floor((lastFloor - firstFloor + 1) * remap(p, CHAPTER_START.tower, 0.58));

/** The counter: whole numbers 0..total, exactly total at 66%. */
export const countAt = (p: number, total: number): number => Math.floor(total * easeInOut(remap(p, 0.5, 0.66)));

/** The flight into the room, 0..1, during the plan chapter. */
export const diveProgress = (p: number): number => easeInOut(remap(p, CHAPTER_START.plan, CHAPTER_START.reserve));

/** 0 to 1 near the end of the flight: the picture of the room opens. */
export const interiorReveal = (p: number): number => easeInOut(remap(p, 0.78, CHAPTER_START.reserve));

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
