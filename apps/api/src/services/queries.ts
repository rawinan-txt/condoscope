import {
  floorPlan, SEARCH_DEFAULTS, unitDepth,
  type Amenity, type Building, type ExplorerPayload, type Floor, type ProjectDetailPayload, type ProjectPage, type ProjectSearchParams,
  type TypeAvailability, type UnitDetailPayload, type UnitFloorPlanPayload, type UnitStatus, type UnitTypeImage, type UnitView,
} from '@condoscope/shared';
import { buildingFromRow, projectFromRow } from './mappers';

// Every value from a caller goes through bind(); the only text spliced into SQL is picked from fixed lists below.

/** Escapes \ % _ so user text is matched literally by `LIKE ? ESCAPE '\'`. */
export const escapeLike = (s: string): string => s.replace(/[\\%_]/g, '\\$&');

type Bind = string | number;
const first = <T>(r: D1Result<unknown>): T | undefined => (r.results as T[])[0];
const rows = <T>(r: D1Result<unknown>): T[] => r.results as T[];

const ORDER_BY = {
  recommended: 'p.is_featured DESC, p.id ASC',
  price_asc: 'p.starting_price ASC, p.id ASC',
  price_desc: 'p.starting_price DESC, p.id ASC',
  newest: 'p.created_at DESC, p.id DESC',
} as const;

function searchWhere(p: ProjectSearchParams): { where: string; binds: Bind[] } {
  const conds: string[] = [];
  const binds: Bind[] = [];
  const q = p.q?.trim();
  if (q) {
    // shortcut: LIKE folds ASCII case only; fine for Thai + ASCII names, add a normalised search column if accented names appear
    const like = `%${escapeLike(q)}%`;
    conds.push("(p.name LIKE ? ESCAPE '\\' OR p.neighborhood LIKE ? ESCAPE '\\' OR p.district LIKE ? ESCAPE '\\' OR p.province LIKE ? ESCAPE '\\')");
    binds.push(like, like, like, like);
  }
  if (p.province !== undefined) { conds.push('p.province = ?'); binds.push(p.province); }
  if (p.district !== undefined) { conds.push('p.district = ?'); binds.push(p.district); }
  if (p.minPrice !== undefined) { conds.push('p.starting_price >= ?'); binds.push(p.minPrice); }
  if (p.maxPrice !== undefined) { conds.push('p.starting_price <= ?'); binds.push(p.maxPrice); }
  if (p.bedrooms !== undefined) {
    conds.push("EXISTS (SELECT 1 FROM buildings b JOIN units u ON u.building_id = b.id WHERE b.project_id = p.id AND u.status = 'available' AND u.bedrooms = ?)");
    binds.push(p.bedrooms);
  }
  return { where: conds.length ? `WHERE ${conds.join(' AND ')}` : '', binds };
}

export async function searchProjects(db: D1Database, p: ProjectSearchParams): Promise<ProjectPage> {
  const sort = p.sort ?? SEARCH_DEFAULTS.sort;
  const limit = p.limit ?? SEARCH_DEFAULTS.limit;
  const offset = p.offset ?? SEARCH_DEFAULTS.offset;
  const { where, binds } = searchWhere(p);
  const [count, page] = await db.batch([
    db.prepare(`SELECT COUNT(*) AS n FROM projects p ${where}`).bind(...binds),
    db.prepare(`SELECT p.* FROM projects p ${where} ORDER BY ${ORDER_BY[sort]} LIMIT ? OFFSET ?`).bind(...binds, limit, offset),
  ]);
  return { items: rows<Parameters<typeof projectFromRow>[0]>(page).map(projectFromRow), total: first<{ n: number }>(count)!.n, limit, offset };
}

export async function getProjectBuildings(db: D1Database, projectId: number): Promise<Building[] | null> {
  const [project, buildings] = await db.batch([
    db.prepare('SELECT 1 AS ok FROM projects WHERE id = ?').bind(projectId),
    db.prepare('SELECT * FROM buildings WHERE project_id = ? ORDER BY id').bind(projectId),
  ]);
  return first(project) ? rows<Parameters<typeof buildingFromRow>[0]>(buildings).map(buildingFromRow) : null;
}

export async function getProjectDetail(db: D1Database, projectId: number): Promise<ProjectDetailPayload | null> {
  const [project, buildings, amenities, availability] = await db.batch([
    db.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId),
    db.prepare('SELECT * FROM buildings WHERE project_id = ? ORDER BY id').bind(projectId),
    db.prepare('SELECT a.* FROM amenities a JOIN project_amenities pa ON pa.amenity_id = a.id WHERE pa.project_id = ? ORDER BY a.id').bind(projectId),
    db.prepare(
      `SELECT u.unit_type AS unit_type, SUM(u.status = 'available') AS available,
              MIN(CASE WHEN u.status = 'available' THEN u.price END) AS min_price, MIN(u.area_sqm) AS min_area
       FROM units u JOIN buildings b ON b.id = u.building_id WHERE b.project_id = ?
       GROUP BY u.unit_type ORDER BY min_area ASC, u.unit_type ASC`,
    ).bind(projectId),
  ]);
  const p = first<Parameters<typeof projectFromRow>[0]>(project);
  if (!p) return null;
  return {
    project: projectFromRow(p),
    buildings: rows<Parameters<typeof buildingFromRow>[0]>(buildings).map(buildingFromRow),
    amenities: rows<Amenity>(amenities),
    availability: rows<TypeAvailability & { min_area: number }>(availability).map(({ unit_type, available, min_price }) => ({ unit_type, available, min_price })),
  };
}

export async function getExplorer(db: D1Database, projectId: number): Promise<ExplorerPayload | null> {
  const [project, buildings, units] = await db.batch([
    db.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId),
    db.prepare('SELECT * FROM buildings WHERE project_id = ? AND has_explorer = 1 ORDER BY id').bind(projectId),
    db.prepare(
      `SELECT u.*, f.floor_number AS floor_number FROM units u
       JOIN floors f ON f.id = u.floor_id JOIN buildings b ON b.id = u.building_id
       WHERE b.project_id = ? AND b.has_explorer = 1 ORDER BY u.id`,
    ).bind(projectId),
  ]);
  const p = first<Parameters<typeof projectFromRow>[0]>(project);
  if (!p) return null;
  return {
    project: projectFromRow(p),
    buildings: rows<Parameters<typeof buildingFromRow>[0]>(buildings).map(buildingFromRow),
    units: rows<UnitView>(units),
  };
}

export async function getBuildingFloors(db: D1Database, buildingId: number): Promise<Floor[] | null> {
  const [building, floors] = await db.batch([
    db.prepare('SELECT 1 AS ok FROM buildings WHERE id = ?').bind(buildingId),
    db.prepare('SELECT * FROM floors WHERE building_id = ? ORDER BY floor_number DESC').bind(buildingId),
  ]);
  return first(building) ? rows<Floor>(floors) : null;
}

export async function getBuildingUnits(db: D1Database, buildingId: number, f: { floor?: number; status?: UnitStatus } = {}): Promise<UnitView[] | null> {
  const conds = ['u.building_id = ?'];
  const binds: Bind[] = [buildingId];
  if (f.floor !== undefined) { conds.push('f.floor_number = ?'); binds.push(f.floor); }
  if (f.status !== undefined) { conds.push('u.status = ?'); binds.push(f.status); }
  const [building, units] = await db.batch([
    db.prepare('SELECT 1 AS ok FROM buildings WHERE id = ?').bind(buildingId),
    db.prepare(`SELECT u.*, f.floor_number AS floor_number FROM units u JOIN floors f ON f.id = u.floor_id WHERE ${conds.join(' AND ')} ORDER BY u.id`).bind(...binds),
  ]);
  return first(building) ? rows<UnitView>(units) : null;
}

export async function getUnitDetail(db: D1Database, unitId: number): Promise<UnitDetailPayload | null> {
  const [unit, building, project, images] = await db.batch([
    db.prepare('SELECT u.*, f.floor_number AS floor_number FROM units u JOIN floors f ON f.id = u.floor_id WHERE u.id = ?').bind(unitId),
    db.prepare('SELECT b.* FROM buildings b JOIN units u ON u.building_id = b.id WHERE u.id = ?').bind(unitId),
    db.prepare('SELECT p.* FROM projects p JOIN buildings b ON b.project_id = p.id JOIN units u ON u.building_id = b.id WHERE u.id = ?').bind(unitId),
    db.prepare('SELECT i.* FROM unit_type_images i JOIN units u ON u.unit_type = i.unit_type WHERE u.id = ? ORDER BY i.sort_order').bind(unitId),
  ]);
  const u = first<UnitView>(unit);
  if (!u) return null;
  return {
    project: projectFromRow(first<Parameters<typeof projectFromRow>[0]>(project)!),
    building: buildingFromRow(first<Parameters<typeof buildingFromRow>[0]>(building)!),
    unit: u,
    images: rows<UnitTypeImage>(images),
  };
}

export async function getUnitImages(db: D1Database, unitId: number): Promise<UnitTypeImage[] | null> {
  const [unit, images] = await db.batch([
    db.prepare('SELECT 1 AS ok FROM units WHERE id = ?').bind(unitId),
    db.prepare('SELECT i.* FROM unit_type_images i JOIN units u ON u.unit_type = i.unit_type WHERE u.id = ? ORDER BY i.sort_order').bind(unitId),
  ]);
  return first(unit) ? rows<UnitTypeImage>(images) : null;
}

export async function getUnitFloorPlan(db: D1Database, unitId: number): Promise<UnitFloorPlanPayload | null> {
  const row = await db
    .prepare('SELECT b.*, u.unit_type AS unit_type, u.bay_index AS bay_index FROM units u JOIN buildings b ON b.id = u.building_id WHERE u.id = ?')
    .bind(unitId)
    .first<Parameters<typeof buildingFromRow>[0] & { unit_type: UnitFloorPlanPayload['unit_type']; bay_index: number }>();
  if (!row) return null;
  const building = buildingFromRow(row);
  return { unit_type: row.unit_type, plan: floorPlan(row.unit_type, building.unit_bay_widths[row.bay_index], unitDepth(building)) };
}
