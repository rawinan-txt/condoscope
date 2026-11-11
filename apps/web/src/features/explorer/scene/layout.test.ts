import { buildingWidth, floorBaseY, unitBox, type ExplorerPayload } from '@condoscope/shared';
import { beforeAll, describe, expect, it } from 'vitest';
import { getExplorer } from '../../../services/api';
import { PerspectiveCamera, Vector3 } from 'three';
import { floorViewGoal, freeWidthFraction, homeView, isCovered, occludesFloorView, projectBounds, stepCamera, towerBox, towerMatrix, towerTop, unitViewGoal, unitWorldCenter } from './layout';

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

describe('floorViewGoal (zoom to a cut floor)', () => {
  const plateCorners = (b: ExplorerPayload['buildings'][number], floor: number) => {
    const y = floorBaseY(b, floor) + b.floor_height_m;
    const hw = buildingWidth(b) / 2, hd = b.footprint_depth_m / 2;
    return [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]].map(([x, z]) => new Vector3(x, y, z).applyMatrix4(towerMatrix(b)));
  };
  const cameraFor = (g: { position: number[]; target: number[] }, aspect: number) => {
    const cam = new PerspectiveCamera(38, aspect, 1, 5000);
    cam.position.set(g.position[0], g.position[1], g.position[2]);
    cam.lookAt(g.target[0], g.target[1], g.target[2]);
    cam.updateMatrixWorld();
    cam.updateProjectionMatrix();
    return cam;
  };

  for (const [name, payload] of [['a straight tower', () => ari], ['a tower turned 90°', () => onNut]] as const) {
    for (const aspect of [0.46, 1, 1.78]) {
      it(`${name}: the whole floor plate fits on screen (aspect ${aspect})`, () => {
        const b = payload().buildings[0];
        const floor = b.last_res_floor - 3;
        const cam = cameraFor(floorViewGoal(b, floor, aspect), aspect);
        for (const c of plateCorners(b, floor)) {
          const p = c.clone().project(cam);
          expect(Math.abs(p.x), `x ${p.x}`).toBeLessThanOrEqual(1);
          expect(Math.abs(p.y), `y ${p.y}`).toBeLessThanOrEqual(1);
          expect(p.z).toBeLessThan(1);
        }
      });
    }
  }

  it('looks at the floor itself, from above, and works for low and high floors', () => {
    const b = ari.buildings[0];
    for (const floor of [b.first_res_floor, b.last_res_floor]) {
      const g = floorViewGoal(b, floor, 1.6);
      const centre = new Vector3(0, floorBaseY(b, floor) + b.floor_height_m, 0).applyMatrix4(towerMatrix(b));
      expect(new Vector3(...g.target).distanceTo(centre)).toBeLessThan(0.01);
      expect(g.position[1]).toBeGreaterThan(g.target[1] + 20);
    }
  });

  it('stays outside the minimum orbit distance and further away on a narrow (phone) screen', () => {
    const b = ari.buildings[0];
    const d = (aspect: number) => { const g = floorViewGoal(b, b.last_res_floor, aspect); return new Vector3(...g.position).distanceTo(new Vector3(...g.target)); };
    expect(d(1.78)).toBeGreaterThanOrEqual(35);
    expect(d(0.46)).toBeGreaterThan(d(1.78));
  });
});

describe('occludesFloorView (which surrounding blocks hide the floor)', () => {
  const cam = new Vector3(0, 100, 100);
  const target = new Vector3(0, 40, 0);
  const box = (x: number, z: number, h: number, half = 10) => ({ min: new Vector3(x - half, 0, z - half), max: new Vector3(x + half, h, z + half) });

  it('is true for a tall block on the line of sight', () => {
    expect(occludesFloorView(cam, target, box(0, 50, 80), 0)).toBe(true);
  });
  it('is false for a block beside the line, behind the floor or too low to matter', () => {
    expect(occludesFloorView(cam, target, box(80, 50, 80), 0)).toBe(false); // off to the side
    expect(occludesFloorView(cam, target, box(0, -60, 80), 0)).toBe(false); // behind the floor, the view ends at the floor
    expect(occludesFloorView(cam, target, box(0, 50, 10), 0)).toBe(false); // lower than the line at that point
  });
  it('a clearance widens the line to the width of the floor being looked at', () => {
    const near = box(22, 50, 80); // 12 m from the box edge to the line
    expect(occludesFloorView(cam, target, near, 0)).toBe(false);
    expect(occludesFloorView(cam, target, near, 15)).toBe(true);
  });
});

describe('floor view and the floating panels', () => {
  it('freeWidthFraction is the share of the screen between the left and right panels', () => {
    const left = { left: 16, top: 16, right: 336, bottom: 400 };
    const right = { left: 1008, top: 16, right: 1384, bottom: 800 };
    expect(freeWidthFraction(1400, [])).toBe(1);
    expect(freeWidthFraction(1400, [left, right])).toBeCloseTo((1400 - 336 - 392) / 1400, 5);
    expect(freeWidthFraction(1400, [right])).toBeCloseTo((1400 - 392) / 1400, 5);
    expect(freeWidthFraction(400, [{ left: 0, top: 0, right: 400, bottom: 100 }])).toBe(1); // a full-width bar (phone sheet) takes height, not width
    expect(freeWidthFraction(500, [left, { left: 150, top: 0, right: 490, bottom: 800 }])).toBe(0.3); // never squeezes below 30 %
  });

  it('fits the whole floor plate inside the free part of the screen', () => {
    const b = ari.buildings[0];
    const floor = b.last_res_floor - 3;
    const aspect = 1400 / 800;
    const g = floorViewGoal(b, floor, aspect, 0.5);
    const cam = new PerspectiveCamera(38, aspect, 1, 5000);
    cam.position.set(...(g.position as [number, number, number]));
    cam.lookAt(...(g.target as [number, number, number]));
    cam.updateMatrixWorld();
    cam.updateProjectionMatrix();
    const y = floorBaseY(b, floor) + b.floor_height_m;
    const hw = buildingWidth(b) / 2, hd = b.footprint_depth_m / 2;
    for (const [x, z] of [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]]) {
      const p = new Vector3(x, y, z).applyMatrix4(towerMatrix(b)).project(cam);
      expect(Math.abs(p.x), `x ${p.x}`).toBeLessThanOrEqual(0.5);
    }
  });
});

describe('floor view and the other towers of the same project', () => {
  it('towerBox encloses the whole tower, rotated, from the ground to its top', () => {
    for (const b of [...ari.buildings, ...onNut.buildings]) {
      const box = towerBox(b);
      expect(box.min.y).toBe(0);
      expect(box.max.y).toBe(towerTop(b));
      const c = new Vector3(0, 10, 0).applyMatrix4(towerMatrix(b));
      expect(c.x).toBeGreaterThan(box.min.x);
      expect(c.x).toBeLessThan(box.max.x);
      expect(c.z).toBeGreaterThan(box.min.z);
      expect(c.z).toBeLessThan(box.max.z);
    }
  });

  it('with no neighbours the camera takes the preferred side (the front of the tower)', () => {
    const b = onNut.buildings[0];
    const g = floorViewGoal(b, b.last_res_floor - 2, 1.6, 1, []);
    const front = new Vector3(0, 0, 1).transformDirection(towerMatrix(b));
    const out = new Vector3(g.position[0] - g.target[0], 0, g.position[2] - g.target[2]).normalize();
    expect(out.dot(front)).toBeGreaterThan(0.8);
  });

  it('the camera looks at a floor of each tower without another tower of the project in the way', () => {
    expect(ari.buildings.length).toBeGreaterThan(1);
    for (const b of ari.buildings) {
      const others = ari.buildings.filter((o) => o.id !== b.id).map(towerBox);
      for (const floor of [b.first_res_floor + 5, Math.floor((b.first_res_floor + b.last_res_floor) / 2), b.last_res_floor - 1]) {
        const g = floorViewGoal(b, floor, 1.6, 0.5, others);
        const clearance = Math.hypot(buildingWidth(b), b.footprint_depth_m) / 4;
        for (const o of others) expect(occludesFloorView(new Vector3(...g.position), new Vector3(...g.target), o, clearance), `${b.name} floor ${floor}`).toBe(false);
      }
    }
  });
});
