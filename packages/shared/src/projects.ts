/**
 * The 5 mock projects. Names are invented; each was web-searched on 2026-11-09
 * ("<name>" condo + area) and no real project with that name turned up.
 * Places and coordinates are real neighbourhood centres, not real condo buildings.
 *
 * basePricePerSqm (THB, new launch) — searched 2026-11-09, data is thin:
 * - อารีย์: Hipflat lists Via ARI (luxury, 2026) at ~221,577/ตร.ม. and the Phaya Thai average at ~133,103 → 150,000 (upper-mid)
 * - รังสิต/ธัญบุรี: resale listings ~28,800–32,300/ตร.ม. (The Point Rangsit) → 48,000 for a new launch
 * - อ่อนนุช, แคราย, ปากน้ำ: no per-area figure found; estimated between the two anchors from market position
 *   (อ่อนนุช 115,000, แคราย 85,000, ปากน้ำ 70,000). Re-check before presenting these as market data.
 */
export interface TowerSpec { code: string; bays: number[]; firstFloor: number; lastFloor: number; origin: [number, number]; }
export interface ProjectSpec {
  slug: string; name: string; description: string;
  province: string; district: string; neighborhood: string; address_display: string;
  latitude: number; longitude: number; basePricePerSqm: number;
  podium: number; rotation: number; towers: TowerSpec[];
}

export const PROJECTS: ProjectSpec[] = [
  {
    slug: 'noventa-ari', name: 'Noventa Ari',
    description: 'คอนโดสองทาวเวอร์บนโพเดียมสวนลอยฟ้า ในซอยอารีย์ เดินถึงร้านกาแฟและรถไฟฟ้า BTS อารีย์',
    province: 'กรุงเทพมหานคร', district: 'พญาไท', neighborhood: 'อารีย์', address_display: 'ซอยอารีย์ เขตพญาไท กรุงเทพฯ',
    latitude: 13.7797, longitude: 100.5449, basePricePerSqm: 150000, podium: 6, rotation: 0,
    towers: [
      { code: 'A', bays: [7, 4, 3.2, 3.2, 4, 9.4], firstFloor: 7, lastFloor: 38, origin: [-14, -6] },
      { code: 'B', bays: [6.5, 3.2, 4, 3.8, 6.5], firstFloor: 7, lastFloor: 30, origin: [17, -6] },
    ],
  },
  {
    slug: 'selvara-on-nut', name: 'Selvara On Nut',
    description: 'คอนโดทาวเวอร์เดียวใกล้ BTS อ่อนนุช ห้องหันรับลมตะวันออก–ตะวันตก มีสระว่ายน้ำบนโพเดียม',
    province: 'กรุงเทพมหานคร', district: 'พระโขนง', neighborhood: 'อ่อนนุช', address_display: 'ถนนสุขุมวิท 77 เขตพระโขนง กรุงเทพฯ',
    latitude: 13.7056, longitude: 100.6011, basePricePerSqm: 115000, podium: 5, rotation: 90,
    towers: [{ code: 'A', bays: [6.8, 3.2, 3.2, 4, 3.2, 3.2, 6.8], firstFloor: 6, lastFloor: 32, origin: [0, 0] }],
  },
  {
    slug: 'kaelo-khae-rai', name: 'Kaelo Khae Rai',
    description: 'คอนโดสองอาคารใกล้แยกแคราย เดินทางสะดวกด้วยรถไฟฟ้าสายสีม่วง เหมาะกับครอบครัวเล็ก',
    province: 'นนทบุรี', district: 'เมืองนนทบุรี', neighborhood: 'แคราย', address_display: 'ถนนงามวงศ์วาน อำเภอเมืองนนทบุรี จังหวัดนนทบุรี',
    latitude: 13.859, longitude: 100.5285, basePricePerSqm: 85000, podium: 4, rotation: 0,
    towers: [
      { code: 'A', bays: [6.5, 4, 3.2, 4, 6.5], firstFloor: 5, lastFloor: 25, origin: [-13, 0] },
      { code: 'B', bays: [6.5, 4, 3.2, 4, 6.5], firstFloor: 5, lastFloor: 22, origin: [13, 0] },
    ],
  },
  {
    slug: 'thalora-rangsit', name: 'Thalora Rangsit',
    description: 'คอนโดโลว์ไรส์ราคาเข้าถึงง่าย ใกล้ห้างใหญ่และมหาวิทยาลัยย่านรังสิต',
    province: 'ปทุมธานี', district: 'ธัญบุรี', neighborhood: 'รังสิต', address_display: 'ถนนรังสิต-นครนายก อำเภอธัญบุรี จังหวัดปทุมธานี',
    latitude: 13.9888, longitude: 100.6178, basePricePerSqm: 48000, podium: 3, rotation: 30,
    towers: [{ code: 'A', bays: [7, 3.2, 4, 4, 3.2, 7], firstFloor: 4, lastFloor: 20, origin: [0, 0] }],
  },
  {
    slug: 'marivo-paknam', name: 'Marivo Paknam',
    description: 'คอนโดห้องกว้างใกล้ปากแม่น้ำเจ้าพระยา ห้องมุมขนาดใหญ่ เดินทางเข้าเมืองด้วย BTS สายสุขุมวิท',
    province: 'สมุทรปราการ', district: 'เมืองสมุทรปราการ', neighborhood: 'ปากน้ำ', address_display: 'ถนนสุขุมวิท อำเภอเมืองสมุทรปราการ จังหวัดสมุทรปราการ',
    latitude: 13.5993, longitude: 100.5968, basePricePerSqm: 70000, podium: 5, rotation: 180,
    towers: [{ code: 'A', bays: [9.4, 3.2, 4, 6.5, 9.4], firstFloor: 6, lastFloor: 30, origin: [0, 0] }],
  },
];

export const AMENITIES: { name: string; icon: string }[] = [
  { name: 'สระว่ายน้ำ', icon: 'waves' },
  { name: 'ฟิตเนส', icon: 'dumbbell' },
  { name: 'สวน', icon: 'trees' },
  { name: 'Co-working', icon: 'laptop' },
  { name: 'ที่จอดรถ', icon: 'car' },
  { name: 'รปภ. 24 ชม.', icon: 'shield-check' },
  { name: 'EV Charger', icon: 'plug-zap' },
  { name: 'ห้องซักรีด', icon: 'washing-machine' },
];
