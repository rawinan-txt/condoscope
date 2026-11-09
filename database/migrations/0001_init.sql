-- CondoScope schema (spec sections 6 and 13). Read-only public data; ids are INTEGER PRIMARY KEY.
-- No CHECK on units.unit_type on purpose: new types (spec section 14) must not need a table rebuild.

CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  province TEXT NOT NULL,
  district TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  latitude REAL NOT NULL CHECK (latitude BETWEEN 5 AND 21),
  longitude REAL NOT NULL CHECK (longitude BETWEEN 97 AND 106),
  address_display TEXT NOT NULL,
  thumbnail_url TEXT,
  starting_price INTEGER NOT NULL CHECK (starting_price > 0),
  total_floors INTEGER NOT NULL CHECK (total_floors > 0),
  total_units INTEGER NOT NULL CHECK (total_units >= 0),
  is_featured INTEGER NOT NULL CHECK (is_featured IN (0, 1)),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_projects_province_price ON projects (province, starting_price);

CREATE TABLE buildings (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects (id),
  name TEXT NOT NULL,
  building_code TEXT NOT NULL,
  total_floors INTEGER NOT NULL CHECK (total_floors > 0),
  first_res_floor INTEGER NOT NULL,
  last_res_floor INTEGER NOT NULL,
  podium_floors INTEGER NOT NULL CHECK (podium_floors >= 0),
  floor_height_m REAL NOT NULL CHECK (floor_height_m > 0),
  footprint_depth_m REAL NOT NULL CHECK (footprint_depth_m > 0),
  corridor_width_m REAL NOT NULL CHECK (corridor_width_m >= 0),
  unit_bay_widths TEXT NOT NULL CHECK (json_valid(unit_bay_widths)),
  origin_x_m REAL NOT NULL,
  origin_z_m REAL NOT NULL,
  rotation_deg REAL NOT NULL,
  has_explorer INTEGER NOT NULL CHECK (has_explorer IN (0, 1)),
  UNIQUE (project_id, building_code),
  CHECK (first_res_floor <= last_res_floor)
);

CREATE TABLE floors (
  id INTEGER PRIMARY KEY,
  building_id INTEGER NOT NULL REFERENCES buildings (id),
  floor_number INTEGER NOT NULL,
  floor_label TEXT NOT NULL,
  UNIQUE (building_id, floor_number)
);

CREATE TABLE units (
  id INTEGER PRIMARY KEY,
  building_id INTEGER NOT NULL REFERENCES buildings (id),
  floor_id INTEGER NOT NULL REFERENCES floors (id),
  unit_number TEXT NOT NULL,
  unit_type TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  area_sqm REAL NOT NULL CHECK (area_sqm > 0),
  bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
  bathrooms INTEGER NOT NULL CHECK (bathrooms >= 0),
  direction TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'reserved', 'sold', 'unavailable')),
  facade TEXT NOT NULL CHECK (facade IN ('front', 'back')),
  bay_index INTEGER NOT NULL CHECK (bay_index >= 0),
  description TEXT NOT NULL,
  UNIQUE (building_id, floor_id, facade, bay_index),
  UNIQUE (building_id, unit_number)
);
CREATE INDEX idx_units_building_floor ON units (building_id, floor_id);
CREATE INDEX idx_units_building_status ON units (building_id, status);

CREATE TABLE amenities (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL
);

CREATE TABLE project_amenities (
  project_id INTEGER NOT NULL REFERENCES projects (id),
  amenity_id INTEGER NOT NULL REFERENCES amenities (id),
  PRIMARY KEY (project_id, amenity_id)
);

-- Interior images are per unit type, not per unit (spec section 13.1)
CREATE TABLE unit_type_images (
  id INTEGER PRIMARY KEY,
  unit_type TEXT NOT NULL,
  room_key TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  UNIQUE (unit_type, room_key)
);
