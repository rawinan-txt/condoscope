import { describe, expect, it } from 'vitest';
import type { Building } from '../src';
import { buildingWidth, compassDirection, floorBaseY, unitBox, unitDepth } from '../src';

const b: Building = {
  id: 1, project_id: 1, name: 'อาคาร A', building_code: 'A', total_floors: 38,
  first_res_floor: 7, last_res_floor: 38, podium_floors: 6, floor_height_m: 3.2,
  footprint_depth_m: 17, corridor_width_m: 2, unit_bay_widths: [7, 4, 3.2, 3.2, 4, 9.4],
  origin_x_m: -14, origin_z_m: -6, rotation_deg: 0, has_explorer: true,
};

describe('geometry', () => {
  it('derives tower size from bay widths', () => {
    expect(buildingWidth(b)).toBeCloseTo(30.8);
    expect(unitDepth(b)).toBe(7.5);
    expect(floorBaseY(b, 7)).toBeCloseTo(21.6);
  });

  it('places front bays on +z and back bays on -z', () => {
    const first = unitBox(b, { floor_number: 7, facade: 'front', bay_index: 0 });
    expect(first.x).toBeCloseTo(-30.8 / 2 + 3.5);
    expect(first.z).toBeCloseTo(4.75);
    expect(first.w).toBe(7);
    expect(first.y).toBeCloseTo(21.6 + 1.6);
    expect(unitBox(b, { floor_number: 7, facade: 'back', bay_index: 0 }).z).toBeCloseTo(-4.75);
  });

  it('packs neighbouring bays edge to edge without overlap', () => {
    for (let i = 1; i < 6; i++) {
      const a = unitBox(b, { floor_number: 8, facade: 'front', bay_index: i - 1 });
      const c = unitBox(b, { floor_number: 8, facade: 'front', bay_index: i });
      expect(a.x + a.w / 2).toBeCloseTo(c.x - c.w / 2);
    }
  });

  it('rejects positions outside the tower', () => {
    expect(() => unitBox(b, { floor_number: 7, facade: 'front', bay_index: 6 })).toThrow(RangeError);
    expect(() => unitBox(b, { floor_number: 6, facade: 'front', bay_index: 0 })).toThrow(RangeError);
    expect(() => unitBox(b, { floor_number: 39, facade: 'front', bay_index: 0 })).toThrow(RangeError);
  });

  it('turns facade + rotation into a Thai compass direction', () => {
    expect(compassDirection('front', 0)).toBe('ทิศใต้');
    expect(compassDirection('back', 0)).toBe('ทิศเหนือ');
    expect(compassDirection('front', 90)).toBe('ทิศตะวันตก');
    expect(compassDirection('front', 45)).toBe('ทิศตะวันตกเฉียงใต้');
    expect(compassDirection('back', 180)).toBe('ทิศใต้');
  });
});
