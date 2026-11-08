import { describe, expect, it } from 'vitest';
import type { UnitType } from '../src';
import { floorPlan } from '../src';

const types: UnitType[] = ['studio', '1br', '2br', '2br_plus'];

describe('floorPlan', () => {
  it.each(types)('%s has a living room and a bathroom', (t) => {
    const keys = floorPlan(t, 6, 7.5).rooms.map((r) => r.key);
    expect(keys).toContain('living');
    expect(keys).toContain('bathroom');
  });

  it('matches bedroom count to the unit type', () => {
    expect(floorPlan('studio', 3.2, 7.5).rooms.map((r) => r.key)).not.toContain('bedroom');
    expect(floorPlan('1br', 4, 7.5).rooms.map((r) => r.key)).toContain('bedroom');
    expect(floorPlan('2br', 7, 7.5).rooms.map((r) => r.key)).toContain('bedroom2');
  });

  it.each(types)('%s keeps rooms inside the plan and hotspots inside their room', (t) => {
    const p = floorPlan(t, 5, 7.5);
    expect(p.aspect).toBeCloseTo(5 / 7.5);
    for (const r of p.rooms) {
      expect(r.x).toBeGreaterThanOrEqual(0); expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(100); expect(r.y + r.h).toBeLessThanOrEqual(100);
    }
    for (const h of p.hotspots) {
      const r = p.rooms.find((x) => x.key === h.key)!;
      expect(r).toBeDefined();
      expect(h.x).toBeGreaterThan(r.x); expect(h.x).toBeLessThan(r.x + r.w);
      expect(h.y).toBeGreaterThan(r.y); expect(h.y).toBeLessThan(r.y + r.h);
    }
  });
});
