import type { Building, ExplorerPayload, UnitView } from '@condoscope/shared';
import { pickShowcaseUnit } from './timeline';

export interface Story { available: number; building: Building; unit: UnitView }

/** What the story tells about a project, or null when there is nothing true to tell (no free unit). */
export function storyOf(d: ExplorerPayload): Story | null {
  const available = d.units.filter((u) => u.status === 'available').length;
  for (const building of d.buildings) {
    const unit = pickShowcaseUnit(d.units.filter((u) => u.building_id === building.id), building);
    if (unit) return { available, building, unit };
  }
  return null;
}
