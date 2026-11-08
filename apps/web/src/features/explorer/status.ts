import { STATUS_LABEL, type UnitStatus, type UnitView } from '@condoscope/shared';
import { effectiveStatus } from './reservations';

export type DisplayStatus = UnitStatus | 'mine';

/** Every status has a text label; colour is never the only signal. */
export const STATUS_STYLE: Record<DisplayStatus, { label: string; color: string }> = {
  available: { label: STATUS_LABEL.available, color: '#16a34a' },
  reserved: { label: STATUS_LABEL.reserved, color: '#d97706' },
  sold: { label: STATUS_LABEL.sold, color: '#e11d48' },
  unavailable: { label: STATUS_LABEL.unavailable, color: '#64748b' },
  mine: { label: 'คุณจอง (Demo)', color: '#2563eb' },
};

export const DISPLAY_ORDER: DisplayStatus[] = ['available', 'reserved', 'sold', 'unavailable', 'mine'];

export const HIGHLIGHT = { selected: '#1d4ed8', hovered: '#60a5fa', match: '#93c5fd', dim: '#e2e8f0', idle: '#cbd5e1' };

/** Colour role of a unit for the building views (shared by SVG and 3D). */
export function unitColorRole(
  x: { selectedId: number | null; hoveredId: number | null; statusMode: boolean; cutFloor: { building_id: number } | null; filters: { maxPrice: number | null; bedrooms: number | null }; matches(u: UnitView): boolean; mine: Set<number> },
  u: UnitView,
): { color: string; kind: 'selected' | 'hovered' | 'status' | 'match' | 'dim' | 'idle' } {
  if (u.id === x.selectedId) return { color: HIGHLIGHT.selected, kind: 'selected' };
  if (u.id === x.hoveredId) return { color: HIGHLIGHT.hovered, kind: 'hovered' };
  if (x.statusMode || x.cutFloor?.building_id === u.building_id) return { color: STATUS_STYLE[effectiveStatus(u, x.mine)].color, kind: 'status' };
  if (x.filters.maxPrice !== null || x.filters.bedrooms !== null) return x.matches(u) ? { color: HIGHLIGHT.match, kind: 'match' } : { color: HIGHLIGHT.dim, kind: 'dim' };
  return { color: HIGHLIGHT.idle, kind: 'idle' };
}
