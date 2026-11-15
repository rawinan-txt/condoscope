import type { UnitView } from '@condoscope/shared';
import { describe, expect, it } from 'vitest';
import { storyUnitRole, unitColorRole } from './status';

const unit = (over: Partial<UnitView>): UnitView => ({ id: 1, building_id: 1, floor_id: 1, unit_number: 'A-701', unit_type: '1br', price: 1, area_sqm: 30, bedrooms: 1, bathrooms: 1, direction: 'ใต้', status: 'available', facade: 'front', bay_index: 0, description: '', floor_number: 7, ...over });

describe('storyUnitRole (the story section lights free units floor by floor)', () => {
  it('an available unit below the lit count glows, above it stays dark', () => {
    expect(storyUnitRole(unit({ floor_number: 7 }), 5, 3).kind).toBe('status'); // floors 5,6,7 lit
    expect(storyUnitRole(unit({ floor_number: 8 }), 5, 3).kind).toBe('dim');
  });
  it('nothing is lit at 0, and units that are not available are always dark', () => {
    expect(storyUnitRole(unit({ floor_number: 5 }), 5, 0).kind).toBe('dim');
    for (const status of ['reserved', 'sold', 'unavailable'] as const) expect(storyUnitRole(unit({ status, floor_number: 5 }), 5, 99).kind).toBe('dim');
  });
});

describe('unitColorRole is untouched', () => {
  it('still gives the idle role with no selection, filter or cut', () => {
    const x = { selectedId: null, hoveredId: null, statusMode: false, cutFloor: null, filters: { maxPrice: null, bedrooms: null }, matches: () => true, mine: new Set<number>() };
    expect(unitColorRole(x, unit({})).kind).toBe('idle');
  });
});
