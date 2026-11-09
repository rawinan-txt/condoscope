import { buildingWidth, unitBox, type ExplorerPayload } from '@condoscope/shared';
import { beforeAll, describe, expect, it } from 'vitest';
import { getExplorer } from '../../../services/api';
import { homeView, projectBounds, unitViewGoal, unitWorldCenter } from './layout';

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
