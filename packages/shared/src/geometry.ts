import type { Building, Facade } from './types';

// shortcut: podium floor height is the same for every project, move to a column if a project needs another value
export const PODIUM_FLOOR_H = 3.6;

/** Box centre and size in metres, building-local (before origin/rotation). x = east, y = up, z = south. */
export interface Box { x: number; y: number; z: number; w: number; h: number; d: number; }

export const buildingWidth = (b: Building): number => b.unit_bay_widths.reduce((s, w) => s + w, 0);
export const unitDepth = (b: Building): number => (b.footprint_depth_m - b.corridor_width_m) / 2;
export const floorBaseY = (b: Building, floor: number): number =>
  b.podium_floors * PODIUM_FLOOR_H + (floor - b.first_res_floor) * b.floor_height_m;

export function unitBox(b: Building, u: { floor_number: number; facade: Facade; bay_index: number }): Box {
  const bays = b.unit_bay_widths;
  if (!Number.isInteger(u.bay_index) || u.bay_index < 0 || u.bay_index >= bays.length) throw new RangeError(`bay ${u.bay_index} outside ${b.building_code}`);
  if (u.floor_number < b.first_res_floor || u.floor_number > b.last_res_floor) throw new RangeError(`floor ${u.floor_number} outside ${b.building_code}`);
  const left = -buildingWidth(b) / 2 + bays.slice(0, u.bay_index).reduce((s, w) => s + w, 0);
  const w = bays[u.bay_index];
  const d = unitDepth(b);
  const z = b.corridor_width_m / 2 + d / 2;
  return { x: left + w / 2, y: floorBaseY(b, u.floor_number) + b.floor_height_m / 2, z: u.facade === 'front' ? z : -z, w, h: b.floor_height_m, d };
}

const COMPASS = ['ทิศเหนือ', 'ทิศตะวันออกเฉียงเหนือ', 'ทิศตะวันออก', 'ทิศตะวันออกเฉียงใต้', 'ทิศใต้', 'ทิศตะวันตกเฉียงใต้', 'ทิศตะวันตก', 'ทิศตะวันตกเฉียงเหนือ'];

/** rotation 0 = front faces south; positive rotation turns the tower clockwise seen from above. */
export function compassDirection(facade: Facade, rotationDeg: number): string {
  const bearing = (((180 + rotationDeg + (facade === 'back' ? 180 : 0)) % 360) + 360) % 360;
  return COMPASS[Math.round(bearing / 45) % 8];
}
