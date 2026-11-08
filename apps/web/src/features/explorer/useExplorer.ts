import type { ExplorerPayload, UnitView } from '@condoscope/shared';
import { useCallback, useMemo, useState } from 'react';
import { loadReservations, saveReservations } from './reservations';

export interface ExplorerFilters { maxPrice: number | null; bedrooms: number | null; }
export type CutFloor = { building_id: number; floor: number } | null;
export type Direction = 'left' | 'right' | 'up' | 'down';

const slotKey = (building: number, floor: number, facade: string, bay: number) => `${building}|${floor}|${facade}|${bay}`;

export function useExplorer(payload: ExplorerPayload) {
  const { units, buildings } = payload;
  const [hoveredId, hover] = useState<number | null>(null);
  const [selectedId, select] = useState<number | null>(null);
  const [cutFloor, setCutFloor] = useState<CutFloor>(null);
  const [statusMode, setStatusMode] = useState(false);
  const [filters, setFilters] = useState<ExplorerFilters>({ maxPrice: null, bedrooms: null });
  const [mine, setMine] = useState<Set<number>>(loadReservations);

  const byId = useMemo(() => new Map(units.map((u) => [u.id, u])), [units]);
  const bySlot = useMemo(() => new Map(units.map((u) => [slotKey(u.building_id, u.floor_number, u.facade, u.bay_index), u])), [units]);

  const updateMine = useCallback((change: (s: Set<number>) => void) => {
    setMine((prev) => {
      const next = new Set(prev);
      change(next);
      saveReservations(next);
      return next;
    });
  }, []);

  const reserve = useCallback((id: number) => {
    if (byId.get(id)?.status === 'available') updateMine((s) => s.add(id));
  }, [byId, updateMine]);
  const cancelReservation = useCallback((id: number) => updateMine((s) => s.delete(id)), [updateMine]);

  const isVisible = useCallback(
    (u: UnitView) => !(cutFloor && u.building_id === cutFloor.building_id && u.floor_number > cutFloor.floor),
    [cutFloor],
  );
  const matches = useCallback(
    (u: UnitView) => (filters.maxPrice === null || u.price <= filters.maxPrice) && (filters.bedrooms === null || u.bedrooms === filters.bedrooms),
    [filters],
  );

  const move = useCallback((dir: Direction) => {
    const cur = selectedId === null ? undefined : byId.get(selectedId);
    if (!cur) { select(units[0]?.id ?? null); return; }
    const df = dir === 'up' ? 1 : dir === 'down' ? -1 : 0;
    const db = dir === 'right' ? 1 : dir === 'left' ? -1 : 0;
    const next = bySlot.get(slotKey(cur.building_id, cur.floor_number + df, cur.facade, cur.bay_index + db));
    if (next && isVisible(next)) select(next.id);
  }, [selectedId, byId, bySlot, units, isVisible]);

  return {
    units, buildings, mine, hoveredId, selectedId, cutFloor, statusMode, filters,
    hover, select, setCutFloor, setStatusMode, setFilters, reserve, cancelReservation, move, isVisible, matches,
    unit: (id: number | null) => (id === null ? undefined : byId.get(id)),
  };
}

export type ExplorerApi = ReturnType<typeof useExplorer>;
