import { floorPlan } from './floorplan';
import { compassDirection } from './geometry';
import { UNIT_TYPE_LABEL } from './labels';
import { AMENITIES, PROJECTS } from './projects';
import { mulberry32, SEED } from './rng';
import type { Building, Dataset, Facade, Floor, Project, RoomKey, Unit, UnitStatus, UnitType } from './types';

export const UNIT_TYPE_BEDROOMS: Record<UnitType, [bedrooms: number, bathrooms: number]> = {
  studio: [0, 1], '1br': [1, 1], '2br': [2, 1], '2br_plus': [2, 2],
};

export const unitTypeForArea = (area: number): UnitType =>
  area < 27.5 ? 'studio' : area < 42 ? '1br' : area < 65 ? '2br' : '2br_plus';

export function unitNumber(code: string, floor: number, facade: Facade, bay: number, bays: number): string {
  const n = facade === 'front' ? bay + 1 : bays + bay + 1;
  return `${code}-${floor}${String(n).padStart(2, '0')}`;
}

const pickStatus = (r: number): UnitStatus => (r < 0.5 ? 'available' : r < 0.64 ? 'reserved' : r < 0.94 ? 'sold' : 'unavailable');

/** 17 AI images exist: 2-bedroom types reuse the 1br balcony, and the second bedroom reuses the first. */
export function imageFile(type: UnitType, room: RoomKey): string {
  if (room === 'balcony' && (type === '2br' || type === '2br_plus')) return '1br/balcony';
  if (room === 'bedroom2') return `${type}/bedroom`;
  return `${type}/${room}`;
}

const DEPTH = 17;
const CORRIDOR = 2;
const FLOOR_H = 3.2;

export function generate(seed: number = SEED): Dataset {
  const rng = mulberry32(seed);
  const d: Dataset = { projects: [], buildings: [], floors: [], units: [], amenities: [], project_amenities: [], unit_type_images: [] };
  AMENITIES.forEach((a, i) => d.amenities.push({ id: i + 1, ...a }));

  for (const spec of PROJECTS) {
    const project: Project = {
      id: d.projects.length + 1, slug: spec.slug, name: spec.name, description: spec.description,
      province: spec.province, district: spec.district, neighborhood: spec.neighborhood,
      latitude: spec.latitude, longitude: spec.longitude, address_display: spec.address_display,
      thumbnail_url: null, starting_price: 0, total_floors: 0, total_units: 0, is_featured: d.projects.length === 0,
      created_at: `${spec.launched}T00:00:00Z`,
    };
    d.projects.push(project);
    const projectUnits: Unit[] = [];

    for (const t of spec.towers) {
      const b: Building = {
        id: d.buildings.length + 1, project_id: project.id, name: `อาคาร ${t.code}`, building_code: t.code,
        total_floors: t.lastFloor, first_res_floor: t.firstFloor, last_res_floor: t.lastFloor, podium_floors: spec.podium,
        floor_height_m: FLOOR_H, footprint_depth_m: DEPTH, corridor_width_m: CORRIDOR, unit_bay_widths: t.bays,
        origin_x_m: t.origin[0], origin_z_m: t.origin[1], rotation_deg: spec.rotation, has_explorer: true,
      };
      d.buildings.push(b);
      const unitD = (DEPTH - CORRIDOR) / 2;
      const n = t.bays.length;

      for (let floor = t.firstFloor; floor <= t.lastFloor; floor++) {
        const f: Floor = { id: d.floors.length + 1, building_id: b.id, floor_number: floor, floor_label: `ชั้น ${floor}` };
        d.floors.push(f);
        for (const facade of ['front', 'back'] as const) {
          t.bays.forEach((w, bay) => {
            const area = Math.round(w * unitD * 10) / 10;
            const type = unitTypeForArea(area);
            const corner = bay === 0 || bay === n - 1;
            const perSqm = spec.basePricePerSqm * (1 + 0.006 * (floor - t.firstFloor)) * (corner ? 1.05 : 1) * (facade === 'front' ? 1.04 : 1);
            const direction = compassDirection(facade, spec.rotation) + (corner ? ' (ห้องมุม)' : '');
            const [bedrooms, bathrooms] = UNIT_TYPE_BEDROOMS[type];
            const u: Unit = {
              id: d.units.length + 1, building_id: b.id, floor_id: f.id, unit_number: unitNumber(t.code, floor, facade, bay, n),
              unit_type: type, price: Math.round((area * perSqm) / 10000) * 10000, area_sqm: area, bedrooms, bathrooms,
              direction, status: pickStatus(rng()), facade, bay_index: bay,
              description: `${UNIT_TYPE_LABEL[type]} ${area} ตร.ม. หันไป${direction}`,
            };
            d.units.push(u);
            projectUnits.push(u);
          });
        }
      }
      project.total_floors = Math.max(project.total_floors, b.total_floors);
    }

    project.total_units = projectUnits.length;
    project.starting_price = Math.min(...projectUnits.map((u) => u.price));
    const count = 4 + Math.floor(rng() * 5); // 4–8 amenities
    const shuffled = d.amenities.map((a) => ({ id: a.id, k: rng() })).sort((x, y) => x.k - y.k);
    shuffled.slice(0, count).map((a) => a.id).sort((x, y) => x - y)
      .forEach((amenity_id) => d.project_amenities.push({ project_id: project.id, amenity_id }));
  }

  for (const type of Object.keys(UNIT_TYPE_BEDROOMS) as UnitType[]) {
    floorPlan(type, 1, 1).hotspots.forEach((h, i) => {
      d.unit_type_images.push({
        id: d.unit_type_images.length + 1, unit_type: type, room_key: h.key,
        image_url: `images/interiors/${imageFile(type, h.key)}.webp`, caption: h.label, sort_order: i,
      });
    });
  }
  return d;
}
