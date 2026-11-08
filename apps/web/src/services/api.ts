import type { Dataset, ExplorerPayload, Floor, UnitDetailPayload, UnitView } from '@condoscope/shared';

export type Source = 'live' | 'fallback';
export interface Result<T> { data: T; source: Source; }
export class NotFoundError extends Error {}

// Plan 2 adds the live API (VITE_API_URL). Until then every call is served from the bundled demo dataset.
let dataset: Promise<Dataset> | undefined;
const loadFallback = () => (dataset ??= import('../data/fallback.json').then((m) => m.default as unknown as Dataset));

function withFloor(units: Dataset['units'], floors: Map<number, Floor>): UnitView[] {
  return units.map((u) => ({ ...u, floor_number: floors.get(u.floor_id)!.floor_number }));
}

function requireId(id: number): number {
  if (!Number.isInteger(id) || id <= 0) throw new NotFoundError(`invalid id ${id}`);
  return id;
}

export async function getExplorer(projectId: number): Promise<Result<ExplorerPayload>> {
  requireId(projectId);
  const d = await loadFallback();
  const project = d.projects.find((p) => p.id === projectId);
  if (!project) throw new NotFoundError(`project ${projectId}`);
  const buildings = d.buildings.filter((b) => b.project_id === projectId && b.has_explorer);
  const ids = new Set(buildings.map((b) => b.id));
  const floors = new Map(d.floors.map((f) => [f.id, f]));
  return { data: { project, buildings, units: withFloor(d.units.filter((u) => ids.has(u.building_id)), floors) }, source: 'fallback' };
}

export async function getUnit(unitId: number): Promise<Result<UnitDetailPayload>> {
  requireId(unitId);
  const d = await loadFallback();
  const raw = d.units.find((u) => u.id === unitId);
  if (!raw) throw new NotFoundError(`unit ${unitId}`);
  const building = d.buildings.find((b) => b.id === raw.building_id)!;
  const project = d.projects.find((p) => p.id === building.project_id)!;
  const [unit] = withFloor([raw], new Map(d.floors.map((f) => [f.id, f])));
  const images = d.unit_type_images.filter((i) => i.unit_type === raw.unit_type).sort((a, b) => a.sort_order - b.sort_order);
  return { data: { project, building, unit, images }, source: 'fallback' };
}

export async function getFeaturedProjectId(): Promise<number> {
  const d = await loadFallback();
  return (d.projects.find((p) => p.is_featured) ?? d.projects[0]).id;
}

/** Shortcut for the temporary home page until Plan 3 adds search. */
export async function listProjects(): Promise<Result<Dataset['projects']>> {
  return { data: (await loadFallback()).projects, source: 'fallback' };
}
