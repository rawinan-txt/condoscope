# Plan 1 — ข้อมูลจำลอง + Building Explorer + Unit Detail

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เว็บ frontend ที่เลือกห้องจากตึก 3D (หรือ SVG สำรอง) แล้วเปิดหน้ารายละเอียดห้องพร้อมแปลนและ hotspot ได้ โดยใช้ข้อมูลจาก fallback JSON ที่สร้างจากตัวสร้างข้อมูลแบบ deterministic

**Architecture:** npm workspaces: `packages/shared` มี types, ตัวสร้างข้อมูล, การคำนวณตำแหน่งห้อง และเทมเพลตแปลน ซึ่งเป็นแหล่งความจริงเดียวของทั้ง frontend และ (ในแผน 2) seed SQL ส่วน `apps/web` เป็น React + Vite อ่านข้อมูลผ่าน `services/api.ts` ซึ่งในแผนนี้ยังไม่มี API จึงคืนข้อมูลจาก fallback พร้อมป้าย "Demo Fallback Mode" เสมอ โค้ด 3D โหลดแบบ lazy เฉพาะหน้า Explorer

**Tech Stack:** TypeScript, React 19, Vite, Tailwind CSS 4, shadcn/ui, React Router (HashRouter), three + @react-three/fiber + @react-three/drei, Vitest + Testing Library, Playwright, lucide-react (ใช้รุ่นเสถียรล่าสุดตอนติดตั้ง three ต้องไม่ต่ำกว่า 0.187 ตามต้นแบบ)

**Spec:** `docs/specs/2026-11-09-condoscope-design.md` (ข้อ 13 มีผลเหนือข้ออื่น) + `docs/original-spec.md`
**อ้างอิงหน้าตา:** `prototype/building-3d/main.js` (ห้ามคัดลอกเป็นโค้ดจริงตรงๆ)

## แผนทั้งหมด

| แผน | ขอบเขต (สเปกข้อ 10) | สถานะ |
|---|---|---|
| **1 (ไฟล์นี้)** | ขั้น 1–3: monorepo, ตัวสร้างข้อมูล, Explorer, Unit Detail | พร้อมทำ |
| 2 | ขั้น 4: Worker + D1 (migrations, seed SQL จาก `generate()`, endpoints, tests), เชื่อม `services/api.ts` | เขียนเมื่อแผน 1 เสร็จ |
| 3 | ขั้น 5–7: Home / Search / Project Detail, Map Explorer, Deploy, README, `docs/architecture.md` | เขียนเมื่อแผน 2 เสร็จ |

## Global Constraints

- งบ 0 บาท: free tier/open source เท่านั้น ห้ามบริการที่ต้องผูกบัตร
- ห้ามใช้ชื่อ ภาพ หรือแปลนของโครงการจริง; ทุกหน้ามีข้อความ "ข้อมูลจำลองเพื่อการสาธิต ไม่มีการขายจริง"
- ห้ามแสดงข้อมูล fallback ว่าเป็นข้อมูล live: ใช้ fallback เมื่อไหร่ต้องมีแบนเนอร์ "Demo Fallback Mode"
- ห้ามมี secret ใน frontend
- UI ภาษาไทย สกุลเงิน THB; ฟอนต์ IBM Plex Sans Thai; โทน white/slate accent เดียว `#2563eb`; ไม่ใช้ gradient/animation เกินจำเป็น
- HashRouter, Vite `base: '/condoscope/'`
- สถานะห้องห้ามสื่อด้วยสีอย่างเดียว ต้องมีข้อความกำกับเสมอ: available=ว่าง, reserved=จองแล้ว, sold=ขายแล้ว, unavailable=ไม่เปิดขาย, การจองในเบราว์เซอร์=คุณจอง (Demo)
- ห้ามโหลด three.js ในหน้าที่ไม่ใช่ Explorer
- การจองจำลอง: `localStorage` ครอบ try/catch, ไม่เก็บข้อมูลส่วนตัว, ไม่ส่ง backend
- ทำงานบน branch `feat/plan-1` ไม่ commit ตรงเข้า `main`; ทุก commit ลงท้าย `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

## Review Focus

1. **ลากเพื่อหมุนแล้วปล่อยบนห้อง** ต้องไม่ถือว่าคลิกเลือกห้อง (ขยับเกิน 5px ระหว่าง pointerdown→up = การลาก) → test ใน Task 8
2. **URL ที่มี id ห้องหรือตึกที่ไม่มีอยู่** (`#/unit/999999`, `#/explorer/abc`) ต้องแสดง "ไม่พบข้อมูล" พร้อมลิงก์กลับ ไม่ใช่หน้าขาว → test ใน Task 5 และ Task 9
3. **localStorage ถูกบล็อกหรือมี JSON เสีย** แอปต้องใช้งานได้ปกติโดยไม่มีการจอง → test ใน Task 4
4. **การจองเก่าค้างอยู่กับห้องที่ตอนนี้ไม่ `available` แล้ว** (ข้อมูลเปลี่ยน) ต้องไม่แสดงว่า "คุณจอง" → test ใน Task 4
5. **เครื่องไม่มี WebGL** ต้องเห็นตึก SVG ที่ใช้ hover/click ได้ทันที ไม่ค้างที่ loading → test ใน Task 8 (เปิด Chromium แบบปิด WebGL)

---

## File Structure

```
package.json                     # workspaces: packages/*, apps/*; scripts: test, gen, dev, e2e
tsconfig.base.json
packages/shared/
  package.json                   # name "@condoscope/shared", exports src/index.ts (ไม่ build ใช้ TS ตรงผ่าน Vite/Vitest)
  src/index.ts                   # re-export ทั้งหมด
  src/types.ts                   # types ข้อมูลและ API
  src/labels.ts                  # ป้ายภาษาไทย สถานะ/ประเภทห้อง, formatTHB
  src/rng.ts                     # PRNG แบบมี seed
  src/projects.ts                # ค่าคงที่ 5 โครงการ + ตึก (ชื่อสมมติ ทำเล พิกัด ราคา/ตร.ม.)
  src/generate.ts                # generate(): Dataset
  src/geometry.ts                # ตำแหน่งกล่องห้องจากพารามิเตอร์ตึก
  src/floorplan.ts               # เทมเพลตแปลนต่อ unit_type
  scripts/write-fallback.ts      # เขียน apps/web/src/data/fallback.json
  test/*.test.ts
apps/web/
  vite.config.ts, index.html, components.json (shadcn)
  src/main.tsx, src/App.tsx      # HashRouter + routes
  src/components/Layout.tsx      # header, ป้ายข้อมูลจำลอง, แบนเนอร์ fallback
  src/components/NotFound.tsx
  src/services/api.ts
  src/data/fallback.json         # สร้างโดย npm run gen (commit ไว้)
  src/features/explorer/
    ExplorerPage.tsx             # หน้า, เลือก 3D หรือ SVG, รวม state
    useExplorer.ts               # state: hover, selected, cutFloor, statusMode, filters
    reservations.ts              # การจองจำลอง
    Building3D.tsx               # lazy, R3F
    BuildingSvg.tsx              # SVG สำรอง front/back
    UnitList.tsx, FloorSelector.tsx, Legend.tsx, Filters.tsx
    UnitTooltip.tsx, UnitPanel.tsx
  src/features/unit/
    UnitPage.tsx, FloorPlanSvg.tsx, ImageViewer.tsx
  e2e/explorer.spec.ts, playwright.config.ts
```

---

### Task 1: Monorepo scaffold + shared types

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `packages/shared/{package.json,tsconfig.json,src/index.ts,src/types.ts,src/labels.ts}`, `packages/shared/test/labels.test.ts`
- Modify: `.gitignore` (เพิ่ม `test-results/`, `playwright-report/`)

**Interfaces — Produces (`packages/shared/src/types.ts`):**
```ts
export type UnitType = 'studio' | '1br' | '2br' | '2br_plus';
export type UnitStatus = 'available' | 'reserved' | 'sold' | 'unavailable';
export type Facade = 'front' | 'back';
export interface Project { id: number; slug: string; name: string; description: string; province: string; district: string; neighborhood: string; latitude: number; longitude: number; address_display: string; thumbnail_url: string | null; starting_price: number; total_floors: number; total_units: number; is_featured: boolean; }
export interface Building { id: number; project_id: number; name: string; building_code: string; total_floors: number; first_res_floor: number; last_res_floor: number; podium_floors: number; floor_height_m: number; footprint_depth_m: number; corridor_width_m: number; unit_bay_widths: number[]; origin_x_m: number; origin_z_m: number; rotation_deg: number; has_explorer: boolean; }
export interface Floor { id: number; building_id: number; floor_number: number; floor_label: string; }
export interface Unit { id: number; building_id: number; floor_id: number; unit_number: string; unit_type: UnitType; price: number; area_sqm: number; bedrooms: number; bathrooms: number; direction: string; status: UnitStatus; facade: Facade; bay_index: number; description: string; }
export interface Amenity { id: number; name: string; icon: string; }  // icon = ชื่อ lucide icon
export interface UnitTypeImage { id: number; unit_type: UnitType; room_key: RoomKey; image_url: string; caption: string; sort_order: number; }
export type RoomKey = 'living' | 'bedroom' | 'bedroom2' | 'kitchen' | 'bathroom' | 'balcony';
export interface Dataset { projects: Project[]; buildings: Building[]; floors: Floor[]; units: Unit[]; amenities: Amenity[]; project_amenities: { project_id: number; amenity_id: number }[]; unit_type_images: UnitTypeImage[]; }
export type UnitView = Unit & { floor_number: number };          // รูปแบบที่ API/fallback คืนให้หน้าเว็บ
export interface ExplorerPayload { project: Project; buildings: Building[]; units: UnitView[]; } // ทั้งโครงการ ทุกทาวเวอร์
export interface UnitDetailPayload { project: Project; building: Building; unit: UnitView; images: UnitTypeImage[]; }
```
**`labels.ts`:** `STATUS_LABEL: Record<UnitStatus,string>`, `UNIT_TYPE_LABEL: Record<UnitType,string>` (สตูดิโอ, 1 ห้องนอน, 2 ห้องนอน, 2 ห้องนอน พลัส), `formatTHB(n: number): string`, `formatMillion(n: number): string` (เช่น `4.25 ล้านบาท`)

- [ ] **Step 1:** สร้าง branch `git checkout -b feat/plan-1`
- [ ] **Step 2:** สร้าง root `package.json` (`"private": true`, `"workspaces": ["packages/*","apps/*"]`, scripts `test: "npm run test --workspaces --if-present"`) และ `packages/shared` ที่มี vitest เป็น devDependency
- [ ] **Step 3: Write the failing test** `labels.test.ts`
```ts
expect(formatTHB(4250000)).toBe('฿4,250,000');
expect(formatMillion(4250000)).toBe('4.25 ล้านบาท');
expect(STATUS_LABEL.sold).toBe('ขายแล้ว');
expect(Object.keys(UNIT_TYPE_LABEL)).toHaveLength(4);
```
- [ ] **Step 4:** `npm test -w @condoscope/shared` → FAIL (ยังไม่มี module)
- [ ] **Step 5:** เขียน `types.ts`, `labels.ts`, `index.ts` (`formatTHB` ใช้ `Intl.NumberFormat('th-TH',{style:'currency',currency:'THB',maximumFractionDigits:0})`, ถ้าผลลัพธ์มีช่องว่างพิเศษให้ปรับ test ตามผลจริงของ Node)
- [ ] **Step 6:** `npm test -w @condoscope/shared` → PASS
- [ ] **Step 7:** Commit `chore: scaffold monorepo and shared types`

---

### Task 2: Geometry — ตำแหน่งห้องจากพารามิเตอร์ตึก

**Files:** Create `packages/shared/src/geometry.ts`, `packages/shared/test/geometry.test.ts`

**Interfaces — Produces:**
```ts
export const PODIUM_FLOOR_H = 3.6; // shortcut: ความสูงชั้นโพเดียมคงที่ทุกโครงการ, ย้ายไปเป็นคอลัมน์ถ้ามีโครงการที่ต่างกัน
export interface Box { x: number; y: number; z: number; w: number; h: number; d: number; } // จุดศูนย์กลาง, พิกัดภายในตึก (ก่อนหมุน), หน่วยเมตร
export function buildingWidth(b: Building): number;            // ผลรวม unit_bay_widths
export function unitDepth(b: Building): number;                // (footprint_depth_m - corridor_width_m) / 2
export function floorBaseY(b: Building, floor: number): number; // podium_floors*PODIUM_FLOOR_H + (floor - first_res_floor)*floor_height_m
export function unitBox(b: Building, u: { floor_number: number; facade: Facade; bay_index: number }): Box;
export function compassDirection(facade: Facade, rotationDeg: number): string; // 8 ทิศภาษาไทย
```
กติกา (ตรงกับต้นแบบ): แกน x เรียง bay จากซ้าย `-W/2` ไปขวา, `front` อยู่ฝั่ง z บวก (`z = corridor/2 + d/2`), `back` ฝั่ง z ลบ; `y` คือกึ่งกลางชั้น; rotation 0 = front หันทิศใต้ หมุนตามเข็มนาฬิกาเมื่อมองจากบน

- [ ] **Step 1: Write the failing test** ด้วยตึกตัวอย่าง `widths [7,4,3.2,3.2,4,9.4], depth 17, corridor 2, podium 6, first 7, floor_height 3.2`
```ts
expect(buildingWidth(b)).toBeCloseTo(30.8);
expect(unitDepth(b)).toBe(7.5);
expect(floorBaseY(b, 7)).toBeCloseTo(21.6);
const first = unitBox(b, { floor_number: 7, facade: 'front', bay_index: 0 });
expect(first.x).toBeCloseTo(-30.8 / 2 + 3.5); expect(first.z).toBeCloseTo(4.75); expect(first.w).toBe(7);
expect(unitBox(b, { floor_number: 7, facade: 'back', bay_index: 0 }).z).toBeCloseTo(-4.75);
// bay ติดกันไม่ทับกัน
for (let i = 1; i < 6; i++) { const a = unitBox(b,{floor_number:8,facade:'front',bay_index:i-1}), c = unitBox(b,{floor_number:8,facade:'front',bay_index:i}); expect(a.x + a.w/2).toBeCloseTo(c.x - c.w/2); }
expect(compassDirection('front', 0)).toBe('ทิศใต้');
expect(compassDirection('back', 0)).toBe('ทิศเหนือ');
expect(compassDirection('front', 90)).toBe('ทิศตะวันตก');
expect(compassDirection('front', 45)).toBe('ทิศตะวันตกเฉียงใต้');
expect(() => unitBox(b, { floor_number: 7, facade: 'front', bay_index: 6 })).toThrow();
```
- [ ] **Step 2:** รัน → FAIL
- [ ] **Step 3:** เขียน `geometry.ts`; ทิศ: มุมของด้าน = `(180 + rotation + (facade==='back'?180:0)) mod 360` (0=เหนือ, 90=ตะวันออก) แล้วปัดเป็น 8 ทิศ; `unitBox` throw `RangeError` เมื่อ bay_index หรือชั้นอยู่นอกช่วง
- [ ] **Step 4:** รัน → PASS
- [ ] **Step 5:** Commit `feat(shared): unit geometry from building parameters`

---

### Task 3: ตัวสร้างข้อมูล + fallback JSON

**Files:** Create `packages/shared/src/{rng.ts,projects.ts,generate.ts,floorplan.ts}`, `packages/shared/scripts/write-fallback.ts`, `packages/shared/test/{generate.test.ts,floorplan.test.ts}`, `apps/web/src/data/fallback.json` (ไฟล์ที่สร้าง)

**Interfaces — Produces:**
```ts
export function mulberry32(seed: number): () => number;   // rng.ts
export const SEED = 20261109;
export function generate(seed?: number): Dataset;          // generate.ts
export function unitTypeForArea(area: number): UnitType;   // <27.5 studio, <42 1br, <65 2br, ที่เหลือ 2br_plus
export function unitNumber(code: string, floor: number, facade: Facade, bay: number, bays: number): string; // `${code}-${floor}${nn}` nn = front: bay+1, back: bays+bay+1 (2 หลัก)
export interface PlanRoom { key: RoomKey; label: string; x: number; y: number; w: number; h: number; } // % ของแปลน
export interface FloorPlan { aspect: number; rooms: PlanRoom[]; hotspots: { key: RoomKey; label: string; x: number; y: number }[]; }
export function floorPlan(type: UnitType, widthM: number, depthM: number): FloorPlan; // aspect = widthM/depthM
```

**ค่าที่สเปกกำหนด (ใส่ใน `projects.ts`):** ทุกตึก `has_explorer: true`, depth 17, corridor 2, floor_height 3.2, `first_res_floor = podium + 1`

| # | โครงการ (ชื่อสมมติ ตรวจก่อนใช้) | ทำเล | ตึก: bays (ม.) · ชั้นพักอาศัย · origin (x,z) | podium | rotation |
|---|---|---|---|---|---|
| 1 | `Noventa Ari` (`is_featured: true`) | กรุงเทพฯ เขตพญาไท ย่านอารีย์ | A `[7,4,3.2,3.2,4,9.4]` 7–38 (-14,-6) · B `[6.5,3.2,4,3.8,6.5]` 7–30 (17,-6) | 6 | 0 |
| 2 | ตั้งชื่อเอง | กรุงเทพฯ เขตพระโขนง ย่านอ่อนนุช | A `[6.8,3.2,3.2,4,3.2,3.2,6.8]` 6–32 (0,0) | 5 | 90 |
| 3 | ตั้งชื่อเอง | นนทบุรี อ.เมืองนนทบุรี ย่านแคราย | A `[6.5,4,3.8,4,6.5]` 5–25 (-13,0) · B เหมือน A 5–22 (13,0) | 4 | 0 |
| 4 | ตั้งชื่อเอง | ปทุมธานี อ.ธัญบุรี ย่านรังสิต | A `[7,3.2,3.2,3.2,3.2,7]` 4–20 (0,0) | 3 | 30 |
| 5 | ตั้งชื่อเอง | สมุทรปราการ อ.เมืองสมุทรปราการ ย่านปากน้ำ | A `[9.4,4,3.8,4,9.4]` 6–30 (0,0) | 5 | 180 |

(Noventa Ari รวม 624 ห้อง; ทุกโครงการใช้ origin เป็นพิกัดในฉากของโครงการนั้น ห่างกันพอไม่ให้ตึกชนกัน)
- ห้ามใช้ชื่อซ้ำกับโครงการจริง: ก่อนใช้ชื่อแต่ละชื่อ ให้ค้นเว็บ `"<ชื่อ>" คอนโด` และ `"<name>" condo` ถ้าเจอโครงการจริงให้เปลี่ยนชื่อ แล้วจดผลการค้นไว้ในคอมเมนต์ข้างค่าคงที่
- พิกัด: ใช้จุดกลางย่าน (lat/lng 4 ตำแหน่ง) ไม่ปักบนตึกคอนโดจริง
- **ราคาต่อ ตร.ม. ต่อย่าน:** ค้นข้อมูลตลาดล่าสุด (ราคาเปิดขายคอนโดใหม่ 2025–2026 ของแต่ละย่าน) ใส่เป็น `basePricePerSqm` พร้อมคอมเมนต์แหล่งที่มาและวันที่ค้น
- ราคาห้อง = `area × basePricePerSqm × (1 + 0.006×(floor-first)) × (มุม ? 1.05 : 1) × (front ? 1.04 : 1)` ปัดเป็นหลักหมื่น; มุม = bay แรกหรือสุดท้าย
- สถานะสุ่ม: available 50%, reserved 14%, sold 30%, unavailable 6%
- area = `width × unitDepth` ปัด 1 ตำแหน่ง; bedrooms/bathrooms ตามสเปกข้อ 13.7; direction จาก `compassDirection` และต่อท้าย " (ห้องมุม)" ถ้าเป็นห้องมุม
- id ทุกตารางเป็น integer เรียงตามลำดับที่สร้าง เริ่มที่ 1; สร้าง Noventa Ari ก่อนและตึก A ก่อน B เพื่อให้ project id 1 = Noventa Ari, building id 1 = ตึก A (test ใน Task 4–9 อ้างอิง id นี้); `floors` มีเฉพาะชั้นที่อยู่อาศัย `floor_label = "ชั้น N"`
- `starting_price` = ราคาห้องต่ำสุดของโครงการ, `total_units` = จำนวนห้อง, `thumbnail_url` = null (แผน 3 ใส่ภาพ)
- `unit_type_images`: ต่อ unit_type ทุกห้องย่อยในเทมเพลต `image_url = "images/units/<unit_type>/<room_key>.webp"` (ยังไม่มีไฟล์ ใช้ placeholder ใน Task 9)
- amenities 8 รายการ (สระว่ายน้ำ, ฟิตเนส, สวน, co-working, ที่จอดรถ, รปภ. 24 ชม., EV charger, ห้องซักรีด) ผูกโครงการละ 4–8

**เทมเพลตแปลน:** studio = living(รวมนอน)+bathroom+kitchen+balcony; 1br = +bedroom; 2br/2br_plus = +bedroom2 และ 2br_plus มี bathroom ที่สอง (ใช้ key `bathroom` ร่วม hotspot เดียว)

- [ ] **Step 1: Write the failing test** `generate.test.ts`
```ts
const a = generate(), b = generate();
expect(a).toEqual(b);                                                // deterministic
const featured = a.projects.filter(p => p.is_featured); expect(featured).toHaveLength(1);
expect(a.projects).toHaveLength(5);
const ari = a.buildings.filter(x => x.project_id === featured[0].id);
expect(a.units.filter(u => ari.some(x => x.id === u.building_id))).toHaveLength(624);
const pos = new Set(a.units.map(u => `${u.building_id}|${u.floor_id}|${u.facade}|${u.bay_index}`)); expect(pos.size).toBe(a.units.length);
const num = new Set(a.units.map(u => `${u.building_id}|${u.unit_number}`)); expect(num.size).toBe(a.units.length);
for (const u of a.units) { expect(u.price).toBeGreaterThan(0); expect(u.area_sqm).toBeGreaterThan(0); expect(UNIT_TYPE_BEDROOMS[u.unit_type]).toEqual([u.bedrooms, u.bathrooms]); }
expect(a.buildings.every(x => x.has_explorer && x.first_res_floor === x.podium_floors + 1)).toBe(true);
for (const p of a.projects) for (const t of ['studio','1br','2br'] as const) expect(unitsOf(a, p).some(u => u.unit_type === t)).toBe(true);
expect(new Set(a.units.map(u => u.direction.split(' ')[0])).size).toBeGreaterThanOrEqual(4); // rotation ต่างกันได้ทิศหลากหลาย
expect(unitTypeForArea(24)).toBe('studio'); expect(unitTypeForArea(30)).toBe('1br'); expect(unitTypeForArea(52.5)).toBe('2br'); expect(unitTypeForArea(70.5)).toBe('2br_plus');
expect(unitNumber('A', 18, 'front', 4, 6)).toBe('A-1805'); expect(unitNumber('A', 18, 'back', 0, 6)).toBe('A-1807');
for (const p of a.projects) expect(p.starting_price).toBe(Math.min(...unitsOf(a, p).map(u => u.price)));
// fallback.json ที่ commit ไว้ต้องตรงกับ generate()
expect(JSON.parse(readFileSync(fallbackPath, 'utf8'))).toEqual(a);
```
(`UNIT_TYPE_BEDROOMS` export จาก `generate.ts`; `unitsOf` เป็น helper ใน test)
- [ ] **Step 2: Write the failing test** `floorplan.test.ts`: ทุก unit_type ต้องมี room `living`,`bathroom`; studio ไม่มี `bedroom`; 2br มี `bedroom2`; ทุก hotspot อยู่ภายในกรอบห้องที่ key ตรงกัน; ห้องทุกห้องอยู่ใน 0–100
- [ ] **Step 3:** รัน → FAIL
- [ ] **Step 4:** ค้นชื่อโครงการและราคาตลาดตามข้างบน แล้วเขียน `rng.ts`, `projects.ts`, `floorplan.ts`, `generate.ts`
- [ ] **Step 5:** เขียน `scripts/write-fallback.ts` (เขียน `JSON.stringify(generate(), null, 0)`) และ root script `"gen": "npx tsx packages/shared/scripts/write-fallback.ts"`; รัน `npm run gen`
- [ ] **Step 6:** รัน `npm test -w @condoscope/shared` → PASS
- [ ] **Step 7:** Commit `feat(shared): deterministic data generator and fallback dataset`

---

### Task 4: Web app shell, data service, การจองจำลอง

**Files:**
- Create: `apps/web/` (Vite React TS), `src/main.tsx`, `src/App.tsx`, `src/components/{Layout.tsx,NotFound.tsx}`, `src/services/api.ts`, `src/features/explorer/reservations.ts`
- Test: `apps/web/src/services/api.test.ts`, `apps/web/src/features/explorer/reservations.test.ts`

**Interfaces — Produces:**
```ts
// services/api.ts
export type Source = 'live' | 'fallback';
export interface Result<T> { data: T; source: Source; }
export class NotFoundError extends Error {}
export function getExplorer(projectId: number): Promise<Result<ExplorerPayload>>;
export function getUnit(unitId: number): Promise<Result<UnitDetailPayload>>;
export function getFeaturedProjectId(): Promise<number>;       // โครงการที่ is_featured
// reservations.ts
export const RESERVATION_KEY = 'condoscope-demo-reservations';
export function loadReservations(): Set<number>;
export function saveReservations(ids: Set<number>): void;
export function effectiveStatus(u: UnitView, mine: Set<number>): UnitStatus | 'mine';
```
- `api.ts`: ถ้าไม่มี `import.meta.env.VITE_API_URL` ให้ `import('../data/fallback.json')` แบบ dynamic แล้ว join `floor_number` เอง คืน `source: 'fallback'`; ไม่พบ id → throw `NotFoundError` (แผน 2 จะเพิ่มการเรียก API จริง)
- `Layout`: header (โลโก้ CondoScope), ป้าย "ข้อมูลจำลองเพื่อการสาธิต ไม่มีการขายจริง" ทุกหน้า, แบนเนอร์ "Demo Fallback Mode — กำลังแสดงข้อมูลสำรอง ไม่ใช่ข้อมูลจากฐานข้อมูล" เมื่อหน้าลูกส่ง `source === 'fallback'` (ผ่าน React context `useDataSource`)
- Routes: `/` → หน้าชั่วคราวที่มีลิงก์ไป Explorer ของทั้ง 5 โครงการ (shortcut: จนกว่าแผน 3 จะทำ Home), `/explorer/:projectId`, `/unit/:unitId`, `*` → `NotFound`
- ติดตั้ง Tailwind 4 + shadcn/ui (button, sheet, select, badge, tooltip) และฟอนต์ IBM Plex Sans Thai จาก Google Fonts; `vite.config.ts` `base: '/condoscope/'`

- [ ] **Step 1: Write the failing tests**
```ts
// reservations.test.ts
localStorage.setItem(RESERVATION_KEY, '{bad json'); expect(loadReservations().size).toBe(0);
vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); }); expect(loadReservations().size).toBe(0);
vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); }); expect(() => saveReservations(new Set([1]))).not.toThrow();
expect(effectiveStatus({ ...u, status: 'available' }, new Set([u.id]))).toBe('mine');
expect(effectiveStatus({ ...u, status: 'sold' }, new Set([u.id]))).toBe('sold');   // การจองเก่าที่ไม่ valid แล้ว
// api.test.ts
const r = await getExplorer(1); expect(r.source).toBe('fallback'); expect(r.data.buildings.map(b => b.building_code)).toEqual(['A', 'B']); expect(r.data.units).toHaveLength(624); expect(r.data.units[0].floor_number).toBeGreaterThan(0);
expect(await getFeaturedProjectId()).toBe(1);
await expect(getUnit(999999)).rejects.toBeInstanceOf(NotFoundError);
await expect(getExplorer(999999)).rejects.toBeInstanceOf(NotFoundError);
```
- [ ] **Step 2:** `npm test -w web` → FAIL
- [ ] **Step 3:** scaffold Vite + ติดตั้ง dependency + เขียนไฟล์ตาม Interfaces (vitest environment `jsdom`)
- [ ] **Step 4:** `npm test -w web` → PASS; `npm run dev -w web` เปิด `http://localhost:5173/condoscope/` เห็น header, ป้ายข้อมูลจำลอง; `#/xyz` เห็นหน้า NotFound
- [ ] **Step 5:** Commit `feat(web): app shell, fallback data service, demo reservations`

---

### Task 5: Explorer — state, Unit List, Floor Selector, Legend, Filters, แผงรายละเอียด (ยังไม่มีตึก)

**Files:**
- Create: `src/features/explorer/{ExplorerPage.tsx,useExplorer.ts,UnitList.tsx,FloorSelector.tsx,Legend.tsx,Filters.tsx,UnitPanel.tsx}`
- Test: `src/features/explorer/{useExplorer.test.ts,ExplorerPage.test.tsx}`

**Interfaces — Produces:**
```ts
export interface ExplorerFilters { maxPrice: number | null; bedrooms: number | null; }
export interface ExplorerState {
  units: UnitView[]; buildings: Building[]; mine: Set<number>;
  hoveredId: number | null; selectedId: number | null;
  cutFloor: { building_id: number; floor: number } | null; statusMode: boolean; filters: ExplorerFilters;
}
export function useExplorer(payload: ExplorerPayload): ExplorerState & {
  hover(id: number | null): void; select(id: number | null): void;
  setCutFloor(c: { building_id: number; floor: number } | null): void; setStatusMode(on: boolean): void; setFilters(f: ExplorerFilters): void;
  reserve(id: number): void; cancelReservation(id: number): void;   // reserve ทำได้เฉพาะ status available
  move(dir: 'left' | 'right' | 'up' | 'down'): void;               // คีย์บอร์ด: ห้องข้างๆ ในตึกและ facade เดียวกัน / ชั้นบนล่าง ไม่ข้ามตึก
  isVisible(u: UnitView): boolean;                                   // false เมื่อ u อยู่ตึกเดียวกับ cutFloor และ floor_number > cutFloor.floor
  matches(u: UnitView): boolean;                                     // ตรงตัวกรอง
};
```
- `UnitPanel`: แสดงเลขห้อง ชั้น ประเภท พื้นที่ ห้องนอน ห้องน้ำ ทิศ ราคา สถานะ (ข้อความ + สี), ปุ่ม "ดูรายละเอียดห้อง" (`#/unit/:id`), ปุ่ม "ดูทั้งชั้น N", ปุ่ม "จองห้องนี้ (Demo)" / "ยกเลิกการจอง (Demo)" พร้อมข้อความ "การจองนี้เป็นการสาธิต เก็บไว้ในเบราว์เซอร์นี้เท่านั้น"; บนจอเล็ก (<768px) แสดงเป็น bottom sheet (shadcn `Sheet side="bottom"`)
- `UnitList`: `<table>` ปกติ เรียงตามชั้นและเลขห้อง แสดงเฉพาะห้องของชั้นที่เลือก (หรือทั้งตึกถ้าไม่เลือก) แต่ละแถวเป็นปุ่มเลือกห้องที่มี `aria-label`
- `FloorSelector`: `<select>` "ทั้งโครงการ" + ทุกชั้นของทุกตึก จัดกลุ่มด้วย `<optgroup label="ตึก A">` → `setCutFloor`
- `Legend`: สี + ข้อความทั้ง 5 สถานะ
- โหลดข้อมูลไม่ได้ → `NotFound` (`NotFoundError`) หรือข้อความ error พร้อมปุ่มลองใหม่; ระหว่างโหลดแสดง skeleton
- พื้นที่ตึกเว้นเป็น placeholder ไว้ให้ Task 6–7

- [ ] **Step 1: Write the failing tests**
```ts
// useExplorer.test.ts (renderHook ด้วย payload จาก getExplorer(1))
act(() => r.select(a.id)); act(() => r.move('right')); expect(r.selectedId).toBe(unitAt(a.floor_number, a.facade, a.bay_index + 1).id);
act(() => r.move('up')); expect(unit(r.selectedId).floor_number).toBe(a.floor_number + 1);
act(() => r.setCutFloor({ building_id: 1, floor: 10 })); expect(r.isVisible(unitOnFloor(1, 11))).toBe(false); expect(r.isVisible(unitOnFloor(1, 10))).toBe(true); expect(r.isVisible(unitOnFloor(2, 11))).toBe(true); // ตึก B ไม่ถูกตัด
act(() => r.select(lastBayOfA.id)); act(() => r.move('right')); expect(r.selectedId).toBe(lastBayOfA.id); // ไม่ข้ามไปตึก B
act(() => r.reserve(soldUnit.id)); expect(r.mine.has(soldUnit.id)).toBe(false);
act(() => r.reserve(availUnit.id)); expect(r.mine.has(availUnit.id)).toBe(true);
act(() => r.setFilters({ maxPrice: 3_000_000, bedrooms: null })); expect(r.matches(unitPricedAt(3_500_000))).toBe(false);
// ExplorerPage.test.tsx
render ที่ #/explorer/999999 → เห็นข้อความ "ไม่พบข้อมูล" และลิงก์ "กลับหน้าแรก"
คลิกแถวห้องใน UnitList → แผงแสดง unit_number เดียวกัน และ link ไป #/unit/<id>
```
- [ ] **Step 2:** รัน → FAIL
- [ ] **Step 3:** เขียน component และ hook ตาม Interfaces
- [ ] **Step 4:** รัน → PASS
- [ ] **Step 5:** Commit `feat(explorer): state, unit list, floor selector, details panel`

---

### Task 6: SVG fallback ของตึก

**Files:** Create `src/features/explorer/BuildingSvg.tsx`, Test `BuildingSvg.test.tsx`

**Interfaces:** Consumes `unitBox`, `buildingWidth`, `floorBaseY` (Task 2) และ state จาก `useExplorer`. Produces `<BuildingSvg state={…} building={Building} facade="front"|"back" />`; `ExplorerPage` มีปุ่มเลือกตึก (เมื่อโครงการมีหลายตึก) และปุ่ม ด้านหน้า/ด้านหลัง
- `viewBox` เป็นเมตร: กว้าง `buildingWidth`, สูงถึง `floorBaseY(last+1)`; แกน y กลับด้าน (ชั้นสูงอยู่บน); แต่ละห้องเป็น `<rect role="button" tabIndex={-1} aria-label="ห้อง A-1805 ชั้น 18 ว่าง">` สีตาม `effectiveStatus` เมื่อ statusMode หรือตาม filter และ hover/selected ไฮไลต์; สลับ ด้านหน้า/ด้านหลัง ด้วยปุ่ม
- hover → `state.hover`, click → `state.select`, tooltip ใช้ `UnitTooltip` (สร้างไฟล์ในงานนี้: เลขห้อง ชั้น ราคา พื้นที่ ห้องนอน ห้องน้ำ สถานะ)
- ห้องที่ `!isVisible` ไม่วาด

- [ ] **Step 1: Write the failing test:** render ตึก A ของโครงการ 1 ด้านหน้า → จำนวน rect = 6 bays × 32 ชั้น = 192; hover rect ของ A-1805 → tooltip มี "A-1805" และราคาที่จัดรูปแบบแล้ว; click → `selectedId` ตรง; ตั้ง cutFloor `{building_id: 1, floor: 10}` → ไม่มี rect ของชั้น 11
- [ ] **Step 2:** รัน → FAIL
- [ ] **Step 3:** เขียน `BuildingSvg.tsx`, `UnitTooltip.tsx`; ใส่ใน `ExplorerPage` เป็นตัวแสดงผลชั่วคราว
- [ ] **Step 4:** รัน → PASS
- [ ] **Step 5:** Commit `feat(explorer): SVG building fallback`

---

### Task 7: ตึก 3D (ระดับเดียวกับต้นแบบ)

**Files:** Create `src/features/explorer/{Building3D.tsx,scene/Towers.tsx,scene/Podium.tsx,scene/City.tsx,scene/Traffic.tsx,scene/useUnitPicking.ts}`, Modify `ExplorerPage.tsx`

**Interfaces:** Consumes `unitBox`, `floorBaseY` (Task 2), `useExplorer` (Task 5). Produces `export default function Building3D(props: { state: ReturnType<typeof useExplorer>; onUnavailable(): void })` — ถูกโหลดด้วย `React.lazy(() => import('./Building3D'))`

- เลือกตัวแสดงผล: ถ้า `document.createElement('canvas').getContext('webgl2')` เป็น null หรือเกิด `webglcontextlost` → `onUnavailable()` แล้ว `ExplorerPage` สลับไป `BuildingSvg` พร้อมข้อความ "เครื่องนี้แสดง 3D ไม่ได้ กำลังแสดงภาพด้านหน้าตึกแทน"
- ฉากสร้างจาก `payload.buildings` ทั้งหมด ห้ามฝังค่าของโครงการใดโครงการหนึ่ง: โพเดียมคำนวณจากกรอบรวมของทุกตึก (หลังหมุน) + ขอบ 6 ม. สูง `podium_floors × PODIUM_FLOOR_H`; ตำแหน่งกล้องเริ่มต้นคำนวณจากขนาดกรอบรวมและตึกที่สูงที่สุด
- ห้องทั้งหมดของแต่ละตึกเป็น `InstancedMesh` เดียว, `instanceId → unit.id` ผ่าน array; ตำแหน่งจาก `unitBox` แล้วหมุน/เลื่อนตาม `rotation_deg`, `origin_x_m`, `origin_z_m`
- สีห้อง: โหมดสถานะ → สีตาม `effectiveStatus`; มีตัวกรอง → ห้องที่ `matches` สว่าง ห้องอื่นหรี่; hover/selected ไฮไลต์ทับทุกโหมด
- อัปเดตสีเฉพาะ instance ที่เปลี่ยน (เก็บสถานะเดิมไว้เทียบ) ไม่ setColorAt ทั้งหมดทุกเฟรม
- `useUnitPicking`: raycast เฉพาะตอน pointermove (throttle ต่อเฟรมด้วย `requestAnimationFrame`), ข้าม instance ที่ `!isVisible`; ถือว่าคลิกเมื่อ pointer ขยับ ≤ 5px ระหว่าง down→up (Review Focus 1); บนจอสัมผัสไม่มี hover แตะ = เลือก
- คีย์บอร์ด: canvas wrapper `tabIndex=0`, ลูกศร → `state.move`, Enter → ไปหน้า Unit, Esc → `select(null)`
- `OrbitControls` (drei) จำกัดมุมไม่ให้ลงใต้พื้น; องค์ประกอบตามสเปก 4.1: โพเดียม + สวนและสระบนดาดฟ้า, ระเบียง, ขอบพื้นชั้น, ยอดตึก, เมืองจำลอง, ถนน/ทางด่วนมีไฟรถวิ่ง
- โหมดผ่าชั้น: ซ่อน instance และพื้นชั้นที่อยู่เหนือ `cutFloor.floor` เฉพาะตึก `cutFloor.building_id` และย้ายกล้องมามองชั้นนั้นจากบน
- `window.__condoscope = { projectUnit(id: number): { x: number; y: number } | null }` คืนพิกัดหน้าจอของกึ่งกลางห้อง (ใช้ใน e2e เกณฑ์สำเร็จข้อหลัก)

- [ ] **Step 1:** เขียน `Building3D` และ scene ย่อย; เปิด `npm run dev -w web` แล้วตรวจด้วยตา**ทั้ง 5 โครงการ**: ตึกไม่ชนกัน โพเดียมครอบพอดี กล้องเห็นทั้งโครงการ, หมุน ซูม hover ไฮไลต์ + tooltip, คลิกแล้วแผงขึ้น, ผ่าชั้นได้, โหมดสถานะเปลี่ยนสี
- [ ] **Step 2:** ยืนยันว่า three ไม่อยู่ใน chunk หลัก: `npm run build -w web` แล้ว `grep -l "WebGLRenderer" apps/web/dist/assets/*.js` ต้องเจอเฉพาะไฟล์ chunk ของ Building3D ไม่ใช่ `index-*.js`
- [ ] **Step 3:** `npm test -w web` → ยัง PASS ทั้งหมด
- [ ] **Step 4:** Commit `feat(explorer): real-time 3D building`

---

### Task 8: Playwright — เกณฑ์สำเร็จข้อหลัก + fallback

**Files:** Create `apps/web/playwright.config.ts`, `apps/web/e2e/explorer.spec.ts`; root script `"e2e": "npm run e2e -w web"`

`webServer`: `npm run build && npm run preview -- --port 4173`, baseURL `http://localhost:4173/condoscope/`; project `chromium` (ปกติ) และ `chromium-nogl` (`launchOptions.args: ['--disable-webgl','--disable-webgl2']`) ที่รันเฉพาะ test ติด tag `@nogl`

- [ ] **Step 1: Write the tests**
  - `เลือกห้องจากตึก 3D ได้ตรงห้อง` (รันแยกต่อโครงการ 1–5): เปิด `#/explorer/<projectId>`, รอ canvas, สุ่ม unit 5 ห้องที่มองเห็นจาก fallback (ด้วย seed คงที่), สำหรับแต่ละห้อง `projectUnit(id)` → `page.mouse.click(x,y)` → แผงแสดง `unit_number` ของห้องนั้น
  - `hover แสดง tooltip ตรงห้อง`: `mouse.move` ไปที่ห้อง → tooltip มี `unit_number`
  - `ลากแล้วไม่เลือกห้อง`: mouse down บนห้อง, ขยับ 60px, up → ไม่มีแผงรายละเอียด
  - `@nogl ไม่มี WebGL ใช้ SVG`: เห็นข้อความแจ้ง, คลิก rect ของห้องหนึ่ง → แผงแสดงเลขห้องเดียวกัน
  - `แบนเนอร์ fallback และป้ายข้อมูลจำลอง`: เห็นทั้งสองข้อความ
  - `ภาพหน้าจอ`: บันทึก `docs/screenshots/explorer.png` (ใช้ใน README แผน 3)
- [ ] **Step 2:** `npx playwright install chromium` แล้ว `npm run e2e` → PASS ทั้งหมด (ถ้า test 3D fail ให้แก้โค้ด ไม่ใช่ลดเกณฑ์)
- [ ] **Step 3:** Commit `test(e2e): main success criterion and fallback`

---

### Task 9: Unit Detail + Floor plan + Image viewer

**Files:** Create `src/features/unit/{UnitPage.tsx,FloorPlanSvg.tsx,ImageViewer.tsx}`, Test `src/features/unit/UnitPage.test.tsx`, เพิ่ม e2e ใน `explorer.spec.ts`

**Interfaces:** Consumes `getUnit` (Task 4), `floorPlan` (Task 3), `unitBox`/`unitDepth` (Task 2), `effectiveStatus`/reservations (Task 4)
- `UnitPage`: เลขห้อง ชั้น ราคา พื้นที่ ห้องนอน ห้องน้ำ ทิศ สถานะ, แปลน, viewer, ปุ่ม "กลับไปเลือกห้อง" (`#/explorer/<project_id>` และคงห้องที่เลือกไว้ผ่าน query `?unit=<id>` ที่ `ExplorerPage` อ่านไปเรียก `select`)
- `FloorPlanSvg`: วาดห้องย่อยจาก `floorPlan(unit_type, bayWidth, unitDepth)`, hotspot เป็น `<button>` วางตำแหน่ง % พร้อม `aria-label` และ `aria-pressed` บอกจุดที่เลือก
- `ImageViewer`: แสดงภาพตาม hotspot ที่เลือก เปลี่ยนภาพแบบ fade สั้นๆ (เคารพ `prefers-reduced-motion`), ถ้าโหลดภาพไม่ได้ (`onError`) แสดงกล่อง placeholder ที่เขียนว่า "ภาพตัวอย่าง: <ชื่อห้อง> (รอภาพจริง)"; มีปุ่มก่อนหน้า/ถัดไปเป็นแกลเลอรี
- id ไม่มีอยู่ → `NotFound`

- [ ] **Step 1: Write the failing test** `UnitPage.test.tsx`: render `#/unit/<id ของ A-1805>` → เห็น "A-1805", ราคา `formatTHB`, ทิศ; คลิก hotspot "ห้องนอน" → viewer แสดงชื่อ "ห้องนอน" และปุ่มนั้น `aria-pressed="true"`; render `#/unit/999999` → "ไม่พบข้อมูล"
- [ ] **Step 2:** รัน → FAIL
- [ ] **Step 3:** เขียน component
- [ ] **Step 4:** รัน → PASS
- [ ] **Step 5:** เพิ่ม e2e `คลิกห้อง → ดูรายละเอียด → hotspot → กลับไปเลือกห้องอื่น` แล้ว `npm run e2e` → PASS
- [ ] **Step 6:** Commit `feat(unit): unit detail with floor plan hotspots`

---

### Task 10: ความสมจริงของตึก (สเปกข้อ 4.2)

**Files:** Create `src/features/explorer/scene/{interiorMaterial.ts,Lighting.tsx,Landscape.tsx}`, Modify `scene/Towers.tsx`, `Building3D.tsx`; asset `apps/web/public/hdri/`

- interior mapping: `MeshStandardMaterial` + `onBeforeCompile` ให้กระจกแต่ละห้องเห็นผนัง เพดาน ม่าน โคมไฟที่มีความลึก สุ่มต่อห้องด้วย `instanceId` (ไม่ใช้ texture ต่อห้อง)
- รายละเอียดผนัง: กรอบกระจก, แผงผนังทึบ, ครีบแนวตั้ง, ราวระเบียงกระจกขอบโลหะ (InstancedMesh ทั้งหมด)
- HDRI CC0 สองชุด (พลบค่ำ/กลางวัน) จาก Poly Haven ความละเอียด 1k รูปแบบ `.hdr`: **ตรวจ license CC0 บนหน้าดาวน์โหลดและขนาดไฟล์ต่อชุด ≤ 2 MB** แล้วจดชื่อไฟล์ ลิงก์ และ license ไว้ใน `apps/web/public/hdri/README.md`
- AO (`N8AO` จาก `@react-three/postprocessing` หรือ SSAO ของ drei) + เงานุ่ม; บน `pointer: coarse` หรือ FPS < 40 ติดกัน 2 วินาที ให้ปิด AO และลด shadow map ลง (ใช้ `PerformanceMonitor` ของ drei)
- ภูมิทัศน์โพเดียม: ต้นไม้ 3 ทรง, ไฟส่องต้นไม้, เฟอร์นิเจอร์ริมสระ
- ปุ่มสลับ "พลบค่ำ / กลางวัน" (ปุ่มมี `aria-pressed`)

- [ ] **Step 1:** ทำทีละข้อ เปิดดูใน dev เทียบกับ `prototype/building-3d/screenshot-*.png` ว่าดูดีขึ้นหรือเท่าเดิม ไม่แย่ลง
- [ ] **Step 2:** `npm run e2e` → PASS (การคลิกห้องต้องยังตรง)
- [ ] **Step 3:** `npm run build -w web` แล้วจดขนาด chunk ของ Building3D (gzip) ไว้ในข้อความ commit; ถ้าเกิน 600 KB gzip ให้หาสาเหตุก่อน commit
- [ ] **Step 4:** อัปเดตภาพหน้าจอ `docs/screenshots/explorer.png` (รัน e2e) และ commit `feat(explorer): realism pass — interior mapping, HDRI, AO, day/dusk`

---

## เมื่อจบแผน 1
- `npm test` และ `npm run e2e` ผ่านทั้งหมด
- อัปเดต `CLAUDE.md` ส่วนสถานะ แล้วเขียนแผน 2 (Worker + D1) ใน `docs/plans/`
