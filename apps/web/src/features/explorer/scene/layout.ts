import { buildingWidth, floorBaseY, PODIUM_FLOOR_H, unitBox, type Building, type Facade } from '@condoscope/shared';
import { Euler, Matrix4, PerspectiveCamera, Vector3 } from 'three';

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

const FLOOR_VIEW_FOV = 38; // keep in step with the camera in Building3D
const FLOOR_VIEW_ELEVATION = (50 * Math.PI) / 180;

export interface Box3 { min: Vector3; max: Vector3 }

/** World-space box around a whole tower (rotated footprint, balconies included), from the ground to its top. */
export function towerBox(b: Building): Box3 {
  const m = towerMatrix(b);
  const hw = buildingWidth(b) / 2, hd = b.footprint_depth_m / 2 + BALCONY_D;
  const box = { min: new Vector3(Infinity, 0, Infinity), max: new Vector3(-Infinity, towerTop(b), -Infinity) };
  for (const [x, z] of [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]]) {
    const p = new Vector3(x, 0, z).applyMatrix4(m);
    box.min.x = Math.min(box.min.x, p.x); box.max.x = Math.max(box.max.x, p.x);
    box.min.z = Math.min(box.min.z, p.z); box.max.z = Math.max(box.max.z, p.z);
  }
  return box;
}

// sides to look from, as degrees away from the front of the tower; the first one that is not blocked wins
const FLOOR_VIEW_SIDES = [0, 40, -40, 80, -80, 120, -120, 180];

/**
 * Where the camera goes to look at a whole floor of a tower: above it, from the front-ish side, as close as it can be
 * while the whole floor plate (balconies included) still fits on a screen of the given aspect ratio.
 * `freeWidth` (0..1) is the share of the screen width not covered by floating panels, see `freeWidthFraction`.
 * `obstacles` are the other towers of the project: the camera takes the first side from which none of them hides the floor.
 */
export function floorViewGoal(b: Building, floor: number, aspect: number, freeWidth = 1, obstacles: Box3[] = []): { position: Vec3; target: Vec3 } {
  const m = towerMatrix(b);
  const centre = new Vector3(0, floorBaseY(b, floor) + b.floor_height_m, 0).applyMatrix4(m);
  const hw = buildingWidth(b) / 2, hd = b.footprint_depth_m / 2 + BALCONY_D;
  const corners = [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]].map(([x, z]) => new Vector3(x, centre.y, z).applyMatrix4(m));
  const clearance = Math.hypot(buildingWidth(b), b.footprint_depth_m) / 4;
  // fit inside the part of the screen the panels leave free: ask the same question of a narrower screen
  const cam = new PerspectiveCamera(FLOOR_VIEW_FOV, aspect * freeWidth, 1, 5000);

  const lookFrom = (degrees: number) => {
    const a = (degrees * Math.PI) / 180;
    const horizontal = new Vector3(0.35, 0, 1).normalize().applyAxisAngle(new Vector3(0, 1, 0), a);
    const dir = new Vector3(horizontal.x * Math.cos(FLOOR_VIEW_ELEVATION), Math.sin(FLOOR_VIEW_ELEVATION), horizontal.z * Math.cos(FLOOR_VIEW_ELEVATION)).transformDirection(m);
    let dist = 45; // OrbitControls does not let the camera closer than 35 m
    for (let i = 0; i < 80; i++, dist *= 1.06) {
      cam.position.copy(centre).addScaledVector(dir, dist);
      cam.lookAt(centre);
      cam.updateMatrixWorld();
      cam.updateProjectionMatrix();
      // 8% margin so the plate does not touch the screen edge
      if (corners.every((c) => { const p = c.clone().project(cam); return Math.abs(p.x) <= 0.92 && Math.abs(p.y) <= 0.92; })) break;
    }
    return cam.position.clone();
  };

  let chosen = lookFrom(FLOOR_VIEW_SIDES[0]);
  for (const side of FLOOR_VIEW_SIDES) {
    const pos = lookFrom(side);
    if (!obstacles.some((o) => occludesFloorView(pos, centre, o, clearance))) { chosen = pos; break; }
  }
  return { position: chosen.toArray(), target: centre.toArray() };
}

/** True when a box (a surrounding building) hides the view from the camera to the floor: the sight line, widened by `clearance`, passes through it. */
export function occludesFloorView(camera: Vector3, target: Vector3, box: { min: Vector3; max: Vector3 }, clearance: number): boolean {
  let t0 = 0, t1 = 1;
  for (const axis of ['x', 'y', 'z'] as const) {
    const lo = box.min[axis] - clearance, hi = box.max[axis] + clearance;
    const d = target[axis] - camera[axis];
    if (Math.abs(d) < 1e-9) {
      if (camera[axis] < lo || camera[axis] > hi) return false;
    } else {
      const a = (lo - camera[axis]) / d, b = (hi - camera[axis]) / d;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
      if (t0 > t1) return false;
    }
  }
  return true;
}

/** Share of the screen width left free between the floating panels on the left and on the right (never below 30 %). */
export function freeWidthFraction(width: number, panels: Box2D[]): number {
  let left = 0, right = 0;
  for (const p of panels) {
    if (p.right - p.left > width * 0.9) continue; // a full-width bar (phone sheet) covers height, not width
    if ((p.left + p.right) / 2 < width / 2) left = Math.max(left, p.right);
    else right = Math.max(right, width - p.left);
  }
  return Math.min(1, Math.max(0.3, (width - left - right) / width));
}
