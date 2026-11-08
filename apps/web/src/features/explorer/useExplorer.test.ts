import type { ExplorerPayload, Facade } from '@condoscope/shared';
import { act, renderHook } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { getExplorer } from '../../services/api';
import { loadReservations } from './reservations';
import { useExplorer } from './useExplorer';

let payload: ExplorerPayload;
beforeAll(async () => { payload = (await getExplorer(1)).data; });

const unitAt = (building_id: number, floor: number, facade: Facade, bay: number) =>
  payload.units.find((u) => u.building_id === building_id && u.floor_number === floor && u.facade === facade && u.bay_index === bay)!;
const setup = () => renderHook(() => useExplorer(payload));

describe('useExplorer', () => {
  it('moves the selection with arrow directions inside one tower', () => {
    const { result } = setup();
    const a = unitAt(1, 18, 'front', 2);
    act(() => result.current.select(a.id));
    act(() => result.current.move('right'));
    expect(result.current.selectedId).toBe(unitAt(1, 18, 'front', 3).id);
    act(() => result.current.move('up'));
    expect(result.current.selectedId).toBe(unitAt(1, 19, 'front', 3).id);
    act(() => result.current.move('down'));
    act(() => result.current.move('left'));
    expect(result.current.selectedId).toBe(a.id);
  });

  it('does not jump to the other tower at the edge', () => {
    const { result } = setup();
    const last = unitAt(1, 10, 'front', 5);
    act(() => result.current.select(last.id));
    act(() => result.current.move('right'));
    expect(result.current.selectedId).toBe(last.id);
  });

  it('cuts only the chosen tower above the chosen floor', () => {
    const { result } = setup();
    act(() => result.current.setCutFloor({ building_id: 1, floor: 10 }));
    expect(result.current.isVisible(unitAt(1, 11, 'front', 0))).toBe(false);
    expect(result.current.isVisible(unitAt(1, 10, 'front', 0))).toBe(true);
    expect(result.current.isVisible(unitAt(2, 11, 'front', 0))).toBe(true);
  });

  it('reserves only available units and remembers them', () => {
    const { result } = setup();
    const sold = payload.units.find((u) => u.status === 'sold')!;
    const avail = payload.units.find((u) => u.status === 'available')!;
    act(() => result.current.reserve(sold.id));
    expect(result.current.mine.has(sold.id)).toBe(false);
    act(() => result.current.reserve(avail.id));
    expect(result.current.mine.has(avail.id)).toBe(true);
    expect(loadReservations().has(avail.id)).toBe(true);
    act(() => result.current.cancelReservation(avail.id));
    expect(result.current.mine.has(avail.id)).toBe(false);
  });

  it('matches units against price and bedroom filters', () => {
    const { result } = setup();
    const cheap = payload.units.reduce((a, b) => (a.price < b.price ? a : b));
    const dear = payload.units.reduce((a, b) => (a.price > b.price ? a : b));
    expect(result.current.matches(dear)).toBe(true);
    act(() => result.current.setFilters({ maxPrice: cheap.price, bedrooms: null }));
    expect(result.current.matches(cheap)).toBe(true);
    expect(result.current.matches(dear)).toBe(false);
    act(() => result.current.setFilters({ maxPrice: null, bedrooms: 0 }));
    expect(result.current.matches(payload.units.find((u) => u.bedrooms === 2)!)).toBe(false);
  });
});
