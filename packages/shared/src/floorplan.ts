import type { RoomKey, UnitType } from './types';

/** Rooms in % of the plan. x runs along the facade, y = 0 is the corridor door, y = 100 the balcony edge. */
export interface PlanRoom { key: RoomKey; label: string; x: number; y: number; w: number; h: number; }
export interface FloorPlan { aspect: number; rooms: PlanRoom[]; hotspots: { key: RoomKey; label: string; x: number; y: number }[]; }

const LABEL: Record<RoomKey, string> = {
  living: 'ห้องนั่งเล่น', bedroom: 'ห้องนอน', bedroom2: 'ห้องนอน 2', kitchen: 'ครัว', bathroom: 'ห้องน้ำ', balcony: 'ระเบียง',
};

type Rect = [RoomKey, number, number, number, number];
const BALCONY: Rect = ['balcony', 0, 85, 100, 15];
const TEMPLATES: Record<UnitType, Rect[]> = {
  studio: [['bathroom', 0, 0, 40, 30], ['kitchen', 40, 0, 60, 30], ['living', 0, 30, 100, 55], BALCONY],
  '1br': [['bathroom', 0, 0, 40, 30], ['kitchen', 40, 0, 60, 30], ['living', 0, 30, 55, 55], ['bedroom', 55, 30, 45, 55], BALCONY],
  '2br': [['bathroom', 0, 0, 35, 30], ['kitchen', 35, 0, 65, 30], ['living', 0, 30, 40, 55], ['bedroom', 40, 30, 30, 55], ['bedroom2', 70, 30, 30, 55], BALCONY],
  '2br_plus': [['bathroom', 0, 0, 30, 30], ['kitchen', 30, 0, 40, 30], ['bathroom', 70, 0, 30, 30], ['living', 0, 30, 40, 55], ['bedroom', 40, 30, 30, 55], ['bedroom2', 70, 30, 30, 55], BALCONY],
};

export function floorPlan(type: UnitType, widthM: number, depthM: number): FloorPlan {
  const rooms = TEMPLATES[type].map(([key, x, y, w, h]) => ({
    key, label: type === 'studio' && key === 'living' ? 'ห้องนั่งเล่น/ห้องนอน' : LABEL[key], x, y, w, h,
  }));
  const hotspots = rooms
    .filter((r, i) => rooms.findIndex((o) => o.key === r.key) === i) // one hotspot per room type (2br_plus has two bathrooms)
    .map((r) => ({ key: r.key, label: r.label, x: r.x + r.w / 2, y: r.y + r.h / 2 }));
  return { aspect: widthM / depthM, rooms, hotspots };
}
