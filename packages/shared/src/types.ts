export type UnitType = 'studio' | '1br' | '2br' | '2br_plus';
export type UnitStatus = 'available' | 'reserved' | 'sold' | 'unavailable';
export type Facade = 'front' | 'back';
export type RoomKey = 'living' | 'bedroom' | 'bedroom2' | 'kitchen' | 'bathroom' | 'balcony';

export interface Project {
  id: number; slug: string; name: string; description: string;
  province: string; district: string; neighborhood: string;
  latitude: number; longitude: number; address_display: string;
  thumbnail_url: string | null; starting_price: number;
  total_floors: number; total_units: number; is_featured: boolean;
}

export interface Building {
  id: number; project_id: number; name: string; building_code: string; total_floors: number;
  first_res_floor: number; last_res_floor: number; podium_floors: number; floor_height_m: number;
  footprint_depth_m: number; corridor_width_m: number; unit_bay_widths: number[];
  origin_x_m: number; origin_z_m: number; rotation_deg: number; has_explorer: boolean;
}

export interface Floor { id: number; building_id: number; floor_number: number; floor_label: string; }

export interface Unit {
  id: number; building_id: number; floor_id: number; unit_number: string; unit_type: UnitType;
  price: number; area_sqm: number; bedrooms: number; bathrooms: number; direction: string;
  status: UnitStatus; facade: Facade; bay_index: number; description: string;
}

/** icon = lucide icon name */
export interface Amenity { id: number; name: string; icon: string; }

export interface UnitTypeImage {
  id: number; unit_type: UnitType; room_key: RoomKey; image_url: string; caption: string; sort_order: number;
}

export interface Dataset {
  projects: Project[]; buildings: Building[]; floors: Floor[]; units: Unit[];
  amenities: Amenity[]; project_amenities: { project_id: number; amenity_id: number }[];
  unit_type_images: UnitTypeImage[];
}

/** Shape the API / fallback hands to the web app. */
export type UnitView = Unit & { floor_number: number };
/** Whole project: every tower. */
export interface ExplorerPayload { project: Project; buildings: Building[]; units: UnitView[]; }
export interface UnitDetailPayload { project: Project; building: Building; unit: UnitView; images: UnitTypeImage[]; }
