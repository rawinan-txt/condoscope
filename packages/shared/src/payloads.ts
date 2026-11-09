import { floorPlan } from './floorplan';
import { unitDepth } from './geometry';
import type {
  Building, Dataset, ExplorerPayload, Floor, Project, ProjectDetailPayload, ProjectPage, ProjectSearchParams, TypeAvailability,
  UnitDetailPayload, UnitFloorPlanPayload, UnitStatus, UnitTypeImage, UnitView,
} from './types';

export const SEARCH_DEFAULTS = { sort: 'recommended', limit: 20, offset: 0 } as const;
export const SEARCH_MAX_LIMIT = 50;

// SQLite LIKE folds ASCII case only; do the same here so the fallback and the API agree on every input.
const asciiLower = (s: string) => s.replace(/[A-Z]/g, (c) => c.toLowerCase());

function projectIdOfBuilding(d: Dataset): Map<number, number> {
  return new Map(d.buildings.map((b) => [b.id, b.project_id]));
}

function withFloor(d: Dataset, units: Dataset['units']): UnitView[] {
  const floors = new Map(d.floors.map((f) => [f.id, f.floor_number]));
  return units.map((u) => ({ ...u, floor_number: floors.get(u.floor_id)! }));
}

/** Rules (the SQL in apps/api must match): docs/plans/2026-11-09-plan-2-api-d1.md, Task 2. */
export function searchProjectsLocal(d: Dataset, p: ProjectSearchParams): ProjectPage {
  const sort = p.sort ?? SEARCH_DEFAULTS.sort;
  const limit = p.limit ?? SEARCH_DEFAULTS.limit;
  const offset = p.offset ?? SEARCH_DEFAULTS.offset;
  const q = p.q === undefined ? '' : asciiLower(p.q.trim());

  let withBedrooms: Set<number> | undefined;
  if (p.bedrooms !== undefined) {
    const projectOf = projectIdOfBuilding(d);
    withBedrooms = new Set(d.units.filter((u) => u.status === 'available' && u.bedrooms === p.bedrooms).map((u) => projectOf.get(u.building_id)!));
  }

  const matches = d.projects.filter((x) =>
    (q === '' || [x.name, x.neighborhood, x.district, x.province].some((f) => asciiLower(f).includes(q))) &&
    (p.province === undefined || x.province === p.province) &&
    (p.district === undefined || x.district === p.district) &&
    (p.minPrice === undefined || x.starting_price >= p.minPrice) &&
    (p.maxPrice === undefined || x.starting_price <= p.maxPrice) &&
    (withBedrooms === undefined || withBedrooms.has(x.id)));

  const order: Record<typeof sort, (a: Project, b: Project) => number> = {
    recommended: (a, b) => Number(b.is_featured) - Number(a.is_featured) || a.id - b.id,
    price_asc: (a, b) => a.starting_price - b.starting_price || a.id - b.id,
    price_desc: (a, b) => b.starting_price - a.starting_price || a.id - b.id,
    newest: (a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : b.id - a.id),
  };
  matches.sort(order[sort]);
  return { items: matches.slice(offset, offset + limit), total: matches.length, limit, offset };
}

const buildingsOf = (d: Dataset, projectId: number): Building[] => d.buildings.filter((b) => b.project_id === projectId);

export function buildProjectBuildings(d: Dataset, projectId: number): Building[] | null {
  return d.projects.some((p) => p.id === projectId) ? buildingsOf(d, projectId) : null;
}

export function buildProjectDetail(d: Dataset, projectId: number): ProjectDetailPayload | null {
  const project = d.projects.find((p) => p.id === projectId);
  if (!project) return null;
  const buildings = buildingsOf(d, projectId);
  const ids = new Set(buildings.map((b) => b.id));
  const byType = new Map<string, { available: number; min_price: number | null; min_area: number }>();
  for (const u of d.units) {
    if (!ids.has(u.building_id)) continue;
    const t = byType.get(u.unit_type) ?? { available: 0, min_price: null, min_area: Infinity };
    t.min_area = Math.min(t.min_area, u.area_sqm);
    if (u.status === 'available') {
      t.available++;
      t.min_price = t.min_price === null ? u.price : Math.min(t.min_price, u.price);
    }
    byType.set(u.unit_type, t);
  }
  const availability: TypeAvailability[] = [...byType.entries()]
    .sort((a, b) => a[1].min_area - b[1].min_area || a[0].localeCompare(b[0]))
    .map(([unit_type, t]) => ({ unit_type: unit_type as TypeAvailability['unit_type'], available: t.available, min_price: t.min_price }));
  const amenityIds = new Set(d.project_amenities.filter((a) => a.project_id === projectId).map((a) => a.amenity_id));
  return { project, buildings, amenities: d.amenities.filter((a) => amenityIds.has(a.id)), availability };
}

export function buildExplorer(d: Dataset, projectId: number): ExplorerPayload | null {
  const project = d.projects.find((p) => p.id === projectId);
  if (!project) return null;
  const buildings = buildingsOf(d, projectId).filter((b) => b.has_explorer);
  const ids = new Set(buildings.map((b) => b.id));
  const units = withFloor(d, d.units.filter((u) => ids.has(u.building_id))).sort((a, b) => a.id - b.id);
  return { project, buildings, units };
}

export function buildBuildingFloors(d: Dataset, buildingId: number): Floor[] | null {
  if (!d.buildings.some((b) => b.id === buildingId)) return null;
  return d.floors.filter((f) => f.building_id === buildingId).sort((a, b) => b.floor_number - a.floor_number);
}

export function buildBuildingUnits(d: Dataset, buildingId: number, f: { floor?: number; status?: UnitStatus } = {}): UnitView[] | null {
  if (!d.buildings.some((b) => b.id === buildingId)) return null;
  return withFloor(d, d.units.filter((u) => u.building_id === buildingId))
    .filter((u) => (f.floor === undefined || u.floor_number === f.floor) && (f.status === undefined || u.status === f.status))
    .sort((a, b) => a.id - b.id);
}

export function buildUnitImages(d: Dataset, unitId: number): UnitTypeImage[] | null {
  const unit = d.units.find((u) => u.id === unitId);
  if (!unit) return null;
  return d.unit_type_images.filter((i) => i.unit_type === unit.unit_type).sort((a, b) => a.sort_order - b.sort_order);
}

export function buildUnitDetail(d: Dataset, unitId: number): UnitDetailPayload | null {
  const raw = d.units.find((u) => u.id === unitId);
  if (!raw) return null;
  const building = d.buildings.find((b) => b.id === raw.building_id)!;
  const project = d.projects.find((p) => p.id === building.project_id)!;
  const [unit] = withFloor(d, [raw]);
  return { project, building, unit, images: buildUnitImages(d, unitId)! };
}

export function buildUnitFloorPlan(d: Dataset, unitId: number): UnitFloorPlanPayload | null {
  const unit = d.units.find((u) => u.id === unitId);
  if (!unit) return null;
  const building = d.buildings.find((b) => b.id === unit.building_id)!;
  return { unit_type: unit.unit_type, plan: floorPlan(unit.unit_type, building.unit_bay_widths[unit.bay_index], unitDepth(building)) };
}
