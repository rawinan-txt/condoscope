import { buildingWidth, floorBaseY, PODIUM_FLOOR_H, unitBox, type Building, type Facade } from '@condoscope/shared';
import { Euler, Matrix4, Vector3 } from 'three';

/** Balcony slab depth sticking out of each facade, metres. */
export const BALCONY_D = 1.5;
const PODIUM_MARGIN = 6;

/** Building-local → world. Positive rotation_deg turns the tower clockwise seen from above (y up, +z south). */
export function towerMatrix(b: Building): Matrix4 {
  return new Matrix4().makeRotationFromEuler(new Euler(0, (-b.rotation_deg * Math.PI) / 180, 0)).setPosition(b.origin_x_m, 0, b.origin_z_m);
}

export function unitWorldCenter(b: Building, u: { floor_number: number; facade: Facade; bay_index: number }): Vector3 {
  const box = unitBox(b, u);
  return new Vector3(box.x, box.y, box.z).applyMatrix4(towerMatrix(b));
}

export const towerTop = (b: Building) => floorBaseY(b, b.last_res_floor + 1);

/** Camera 70 m out from the unit's facade, slightly above and to the side, looking at the unit. */
export function unitViewGoal(b: Building, u: { floor_number: number; facade: Facade; bay_index: number }): { position: Vec3; target: Vec3 } {
  const target = unitWorldCenter(b, u);
  const out = new Vector3(0.35, 0.25, u.facade === 'front' ? 1 : -1).transformDirection(towerMatrix(b)).multiplyScalar(70);
  return { position: target.clone().add(out).toArray(), target: target.toArray() };
}

export interface Bounds { minX: number; maxX: number; minZ: number; maxZ: number; podiumH: number; top: number; }

/** Footprint of every tower (balconies included) after rotation, plus the podium margin. */
export function projectBounds(buildings: Building[]): Bounds {
  const r: Bounds = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity, podiumH: 0, top: 0 };
  for (const b of buildings) {
    const m = towerMatrix(b);
    const hw = buildingWidth(b) / 2;
    const hd = b.footprint_depth_m / 2 + BALCONY_D;
    for (const [x, z] of [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]]) {
      const p = new Vector3(x, 0, z).applyMatrix4(m);
      r.minX = Math.min(r.minX, p.x); r.maxX = Math.max(r.maxX, p.x);
      r.minZ = Math.min(r.minZ, p.z); r.maxZ = Math.max(r.maxZ, p.z);
    }
    r.podiumH = Math.max(r.podiumH, b.podium_floors * PODIUM_FLOOR_H);
    r.top = Math.max(r.top, towerTop(b));
  }
  r.minX -= PODIUM_MARGIN; r.maxX += PODIUM_MARGIN; r.minZ -= PODIUM_MARGIN; r.maxZ += PODIUM_MARGIN;
  return r;
}

export type Vec3 = [number, number, number];

/** Three-quarter view from the south-east that keeps the tallest tower and the podium in frame. */
export function homeView(r: Bounds): { position: Vec3; target: Vec3 } {
  const cx = (r.minX + r.maxX) / 2;
  const cz = (r.minZ + r.maxZ) / 2;
  const span = Math.max(r.maxX - r.minX, r.maxZ - r.minZ);
  const dist = Math.max(r.top * 1.8, span * 2);
  const dir = new Vector3(0.62, 0.32, 0.72).normalize().multiplyScalar(dist);
  const ty = r.top * 0.5;
  return { position: [cx + dir.x, ty + dir.y, cz + dir.z], target: [cx, ty, cz] };
}

export interface Box2D { left: number; top: number; right: number; bottom: number }

/** True when the screen point lies under one of the floating panels (grown by `margin` px). */
export function isCovered(px: number, py: number, panels: Box2D[], margin = 0): boolean {
  return panels.some((r) => px >= r.left - margin && px <= r.right + margin && py >= r.top - margin && py <= r.bottom + margin);
}

/**
 * One frame of the glide of the camera to a goal. Moves `pos` and `target` in place and says whether it has arrived.
 * With reduced motion it jumps straight to the goal instead of gliding.
 */
export function stepCamera(pos: Vector3, target: Vector3, goal: { pos: Vector3; target: Vector3 }, dt: number, reducedMotion: boolean): { done: boolean } {
  if (reducedMotion) {
    pos.copy(goal.pos);
    target.copy(goal.target);
    return { done: true };
  }
  const k = 1 - Math.exp(-dt * 4);
  pos.lerp(goal.pos, k);
  target.lerp(goal.target, k);
  return { done: pos.distanceTo(goal.pos) < 0.5 };
}
