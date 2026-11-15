import type { Building, UnitView } from '@condoscope/shared';
import { homeView, unitViewGoal, type Bounds, type Vec3 } from '../explorer/scene/layout';
import { easeInOut, remap } from './scroll';
import { CHAPTER_START, ORBIT_DEGREES } from './timeline';

// Camera poses. Kept apart from timeline.ts because layout.ts pulls in three.js, which the stills tier must not download.
export type Pose = { position: Vec3; target: Vec3 };

/** Camera on a circle round the tower: starts at the home view, same distance and height all the way. */
export function orbitPose(b: Bounds, p: number): Pose {
  const home = homeView(b);
  const angle = (ORBIT_DEGREES * Math.PI / 180) * easeInOut(remap(p, CHAPTER_START.orbit, CHAPTER_START.lights));
  const dx = home.position[0] - home.target[0];
  const dz = home.position[2] - home.target[2];
  const c = Math.cos(angle), s = Math.sin(angle);
  return { position: [home.target[0] + dx * c - dz * s, home.position[1], home.target[2] + dx * s + dz * c], target: home.target };
}

const mix = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/**
 * From the given pose (the end of the orbit) to the close view of the unit. The camera swings round the tower (angle, distance and
 * height each blend on their own) instead of cutting straight across, which would pass through the building.
 */
export function diveGoal(b: Building, u: UnitView, p: number, from: Pose): Pose {
  const t = easeInOut(remap(p, CHAPTER_START.dive, CHAPTER_START.cta));
  const to = unitViewGoal(b, u);
  if (t <= 0) return from;
  if (t >= 1) return to;
  const [cx, cz] = [from.target[0], from.target[2]];
  const polar = (v: Vec3) => ({ a: Math.atan2(v[2] - cz, v[0] - cx), r: Math.hypot(v[0] - cx, v[2] - cz) });
  const p0 = polar(from.position), p1 = polar(to.position);
  let da = p1.a - p0.a;
  da -= Math.round(da / (2 * Math.PI)) * 2 * Math.PI; // the short way round
  const a = p0.a + da * t, r = p0.r + (p1.r - p0.r) * t;
  return { position: [cx + r * Math.cos(a), from.position[1] + (to.position[1] - from.position[1]) * t, cz + r * Math.sin(a)], target: mix(from.target, to.target, t) };
}
