import { buildingWidth, unitBox, type ExplorerPayload } from '@condoscope/shared';
import { beforeAll, describe, expect, it } from 'vitest';
import { getExplorer } from '../../../services/api';
import { Vector3 } from 'three';
import { homeView, isCovered, projectBounds, stepCamera, unitViewGoal, unitWorldCenter } from './layout';

let ari: ExplorerPayload;
let onNut: ExplorerPayload;
beforeAll(async () => {
  ari = (await getExplorer(1)).data;
  onNut = (await getExplorer(2)).data;
});

describe('scene layout', () => {
  it('places a unit at its building origin when the tower is not rotated', () => {
    const b = ari.buildings[0];
    const u = ari.units.find((x) => x.building_id === b.id)!;
    const box = unitBox(b, u);
    const p = unitWorldCenter(b, u);
    expect(p.x).toBeCloseTo(box.x + b.origin_x_m);
    expect(p.y).toBeCloseTo(box.y);
    expect(p.z).toBeCloseTo(box.z + b.origin_z_m);
  });

  it('turns the front facade to the west for a 90° tower (matches compassDirection)', () => {
    const b = onNut.buildings[0];
    expect(b.rotation_deg).toBe(90);
    const u = onNut.units.find((x) => x.facade === 'front' && x.bay_index === 3)!;
    expect(u.direction.startsWith('ทิศตะวันตก')).toBe(true);
    const p = unitWorldCenter(b, u);
    expect(p.x).toBeLessThan(b.origin_x_m - 4);
    expect(Math.abs(p.z - b.origin_z_m)).toBeLessThan(1);
  });

  it('wraps every tower of the project in the podium bounds', () => {
    const r = projectBounds(ari.buildings);
    const [a, b] = ari.buildings;
    expect(r.minX).toBeLessThanOrEqual(a.origin_x_m - buildingWidth(a) / 2);
    expect(r.maxX).toBeGreaterThanOrEqual(b.origin_x_m + buildingWidth(b) / 2);
    expect(r.podiumH).toBeCloseTo(6 * 3.6);
    expect(r.top).toBeGreaterThan(r.podiumH + 31 * 3.2);
  });

  it('puts the camera outside the facade a unit is on, looking at it', () => {
    const b = ari.buildings[0];
    const front = ari.units.find((u) => u.building_id === b.id && u.facade === 'front' && u.floor_number === 20)!;
    const back = ari.units.find((u) => u.building_id === b.id && u.facade === 'back' && u.floor_number === 20)!;
    const f = unitViewGoal(b, front);
    expect(f.position[2]).toBeGreaterThan(f.target[2] + 30);
    expect(f.target).toEqual(unitWorldCenter(b, front).toArray());
    expect(unitViewGoal(b, back).position[2]).toBeLessThan(unitWorldCenter(b, back).z - 30);
    const turned = onNut.units.find((u) => u.facade === 'front')!;
    const t = unitViewGoal(onNut.buildings[0], turned);
    expect(t.position[0]).toBeLessThan(t.target[0] - 30); // 90° tower: front faces west
  });

  it('frames the whole project from the home camera', () => {
    const r = projectBounds(ari.buildings);
    const v = homeView(r);
    const dist = Math.hypot(v.position[0] - v.target[0], v.position[1] - v.target[1], v.position[2] - v.target[2]);
    expect(dist).toBeGreaterThan(r.top);
    expect(v.target[1]).toBeGreaterThan(0);
    expect(v.target[1]).toBeLessThan(r.top);
  });
});

describe('isCovered (units under the floating panels count as hidden)', () => {
  const panels = [{ left: 100, top: 50, right: 300, bottom: 250 }, { left: 900, top: 0, right: 1260, bottom: 700 }];
  it('is true inside a panel and false in the free space', () => {
    expect(isCovered(200, 100, panels)).toBe(true);
    expect(isCovered(1000, 300, panels)).toBe(true);
    expect(isCovered(600, 300, panels)).toBe(false);
    expect(isCovered(600, 300, [])).toBe(false);
  });
  it('keeps a margin so a click cannot land on the panel edge', () => {
    expect(isCovered(305, 100, panels, 8)).toBe(true); // 5 px outside the panel, inside the margin
    expect(isCovered(320, 100, panels, 8)).toBe(false);
    expect(isCovered(305, 100, panels)).toBe(false);
  });
});

describe('stepCamera (the glide to a goal)', () => {
  const goal = { pos: new Vector3(100, 50, 100), target: new Vector3(0, 30, 0) };
  const start = () => ({ pos: new Vector3(0, 10, 200), target: new Vector3(0, 0, 0) });

  it('moves part of the way each frame and keeps going', () => {
    const cam = start();
    const r = stepCamera(cam.pos, cam.target, goal, 0.016, false);
    expect(r.done).toBe(false);
    expect(cam.pos.x).toBeGreaterThan(0);
    expect(cam.pos.x).toBeLessThan(100);
    expect(cam.target.y).toBeGreaterThan(0);
    expect(cam.target.y).toBeLessThan(30);
  });

  it('arrives after enough frames', () => {
    const cam = start();
    let done = false;
    for (let i = 0; i < 600 && !done; i++) done = stepCamera(cam.pos, cam.target, goal, 0.016, false).done;
    expect(done).toBe(true);
    expect(cam.pos.distanceTo(goal.pos)).toBeLessThan(1);
  });

  it('with reduced motion jumps straight to the goal in one frame', () => {
    const cam = start();
    const r = stepCamera(cam.pos, cam.target, goal, 0.016, true);
    expect(r.done).toBe(true);
    expect(cam.pos.equals(goal.pos)).toBe(true);
    expect(cam.target.equals(goal.target)).toBe(true);
  });
});
