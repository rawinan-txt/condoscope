import type { Building, ExplorerPayload, Project, ProjectDetailPayload, UnitView } from '@condoscope/shared';
import { pickShowcaseUnit } from './timeline';

export interface Story { available: number; building: Building; unit: UnitView }

/** What a tower of the story shows, or null when there is nothing true to show (no free unit). */
export function storyOf(d: ExplorerPayload): Story | null {
  const available = d.units.filter((u) => u.status === 'available').length;
  for (const building of d.buildings) {
    const unit = pickShowcaseUnit(d.units.filter((u) => u.building_id === building.id), building);
    if (unit) return { available, building, unit };
  }
  return null;
}

/** The three projects whose towers the story shows: the featured one first, then the others by id (fewer if there are fewer projects). */
export function pickStoryProjects(projects: Project[]): Project[] {
  const byId = (a: Project, b: Project) => a.id - b.id;
  return [...projects.filter((p) => p.is_featured).sort(byId), ...projects.filter((p) => !p.is_featured).sort(byId)].slice(0, 3);
}

/** The whole-system numbers: how many projects, and how many units are free in all of them. `available` is null unless every project answered (a partial sum would be a wrong number). */
export function totalsOf(projects: Project[], details: (ProjectDetailPayload | null)[]): { projects: number; available: number | null } {
  const ok = details.length === projects.length && details.every((d) => d !== null);
  return { projects: projects.length, available: ok ? details.reduce((n, d) => n + d!.availability.reduce((m, a) => m + a.available, 0), 0) : null };
}
