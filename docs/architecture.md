# สถาปัตยกรรม CondoScope (ส่วนข้อมูลและ API)

เอกสารนี้รวมเรื่องฐานข้อมูลและ API ไว้ไฟล์เดียว (สเปกข้อ 13.3) แผน 3 จะมาเติมส่วนหน้าเว็บและการ deploy
ข้อมูลทั้งหมดเป็นข้อมูลจำลอง ไม่มีการขายจริง

## ภาพรวม

```mermaid
flowchart LR
  subgraph shared["packages/shared (แหล่งความจริงเดียว)"]
    G["generate()<br/>ตัวสร้างข้อมูลแบบ deterministic"]
    B["payload builders<br/>(searchProjectsLocal, buildExplorer, ...)"]
  end
  G -->|npm run gen| FB["apps/web/src/data/fallback.json"]
  G -->|npm run gen| SQL["database/seeds/seed.sql"]
  SQL -->|wrangler d1 execute| D1[("Cloudflare D1")]
  Web["เว็บ React (GitHub Pages)"] -->|HTTPS GET| API["Cloudflare Worker (Hono)"]
  API -->|SQL + bind| D1
  Web -. "API ล่ม / ช้า / ตอบขยะ<br/>แบนเนอร์ Demo Fallback Mode" .-> FB
  B --> Web
```

- เว็บเรียก API ก่อนเสมอ (ตั้ง `VITE_API_URL`) ถ้า API ล่ม ช้าเกิน 5 วินาที ตอบ 5xx ตอบหน้า HTML หรือ JSON เสีย จะใช้ `fallback.json` ผ่าน payload builders ชุดเดียวกับที่เป็น "เฉลย" ของ API test และขึ้นแบนเนอร์ **Demo Fallback Mode** ทุกครั้ง
- API ตอบ 400/404 ในรูปแบบ error ของ API เองเท่านั้นที่เว็บถือว่า "ไม่พบข้อมูล" (ไม่ fallback)
- ถ้าไม่ตั้ง `VITE_API_URL` เว็บใช้ข้อมูลสำรองเสมอ และไม่เรียก API เลย

## ฐานข้อมูล (D1, `database/migrations/0001_init.sql`)

```mermaid
erDiagram
  projects ||--o{ buildings : "project_id"
  projects ||--o{ project_amenities : "project_id"
  amenities ||--o{ project_amenities : "amenity_id"
  buildings ||--o{ floors : "building_id"
  buildings ||--o{ units : "building_id"
  floors ||--o{ units : "floor_id"
  unit_type_images }o..o{ units : "ตรงกันที่ unit_type (ไม่มี FK)"

  projects { int id PK  text slug UK  text name  text province  text district  text neighborhood  real latitude  real longitude  int starting_price  int total_floors  int total_units  int is_featured  text created_at }
  buildings { int id PK  int project_id FK  text building_code  int first_res_floor  int last_res_floor  int podium_floors  text unit_bay_widths "JSON"  real origin_x_m  real origin_z_m  real rotation_deg  int has_explorer }
  floors { int id PK  int building_id FK  int floor_number  text floor_label }
  units { int id PK  int building_id FK  int floor_id FK  text unit_number  text unit_type  int price  real area_sqm  int bedrooms  int bathrooms  text direction  text status  text facade  int bay_index }
  amenities { int id PK  text name UK  text icon }
  project_amenities { int project_id PK  int amenity_id PK }
  unit_type_images { int id PK  text unit_type  text room_key  text image_url  text caption  int sort_order }
```

- ข้อจำกัดที่สำคัญ: `UNIQUE(building_id, floor_id, facade, bay_index)` (ห้องไม่ซ้ำตำแหน่ง), `UNIQUE(building_id, unit_number)`, CHECK ของ `status`, `facade`, `area_sqm > 0`, `price > 0`, `json_valid(unit_bay_widths)`, foreign key ทุกตัว (D1 บังคับให้)
- **`units.unit_type` ไม่มี CHECK โดยตั้งใจ** เพื่อให้เพิ่มประเภทห้องใหม่ (penthouse/duplex/full-floor ในสเปกข้อ 14) ได้โดยไม่ต้องสร้างตารางใหม่
- Index: `idx_projects_province_price`, `idx_units_building_floor`, `idx_units_building_status`
- ภาพภายในห้องผูกกับ "ประเภทห้อง" ไม่ใช่รายห้อง (สเปกข้อ 13.1) และแปลนห้องไม่เก็บในฐานข้อมูล: คำนวณจากเทมเพลตใน `packages/shared/src/floorplan.ts`

## API (Hono บน Cloudflare Workers, อ่านอย่างเดียว)

ตอบเป็นข้อมูลตรงๆ ไม่ห่อด้วย `{ data }` ชนิดข้อมูลทั้งหมดอยู่ใน `packages/shared/src/types.ts`

| Method + path | ผลลัพธ์ | หมายเหตุ |
|---|---|---|
| `GET /api/health` | `{ ok, db }` | ไม่แคช; DB พัง → 503 |
| `GET /api/projects` | `ProjectPage` | `q`, `province`, `district`, `minPrice`, `maxPrice`, `bedrooms` (0/1/2), `sort`, `limit` (1–50), `offset` |
| `GET /api/projects/:id` | `ProjectDetailPayload` | ตึก, สิ่งอำนวยความสะดวก, จำนวนห้องว่างและราคาต่ำสุดแยกประเภท |
| `GET /api/projects/:id/buildings` | `Building[]` | |
| `GET /api/projects/:id/explorer` | `ExplorerPayload` | รูปทรงตึก + ห้องทั้งหมดของโครงการ **ใน request เดียว** |
| `GET /api/buildings/:id/floors` | `Floor[]` | ชั้นมาก→น้อย |
| `GET /api/buildings/:id/units` | `UnitView[]` | `floor`, `status` ถ้าไม่เจอ → `[]` (200) |
| `GET /api/units/:id` | `UnitDetailPayload` | |
| `GET /api/units/:id/images` | `UnitTypeImage[]` | ตามประเภทห้อง |
| `GET /api/units/:id/floor-plan` | `UnitFloorPlanPayload` | |

กติกาการค้นหา `/api/projects` (SQL และ `searchProjectsLocal` ของ fallback ต้องให้ผลเหมือนกัน มี test เทียบทุกเคส)
- `q` ตัดช่องว่างหัวท้าย ว่าง = ไม่กรอง จับคู่แบบ "มีข้อความนี้อยู่" ใน ชื่อ/ย่าน/เขต/จังหวัด ไม่สนตัวพิมพ์ ASCII; `% _ \ ' "` เป็นตัวอักษรธรรมดา (ใช้ `instr(lower(...))` ไม่ใช้ `LIKE` เพราะ D1 จำกัดความยาว pattern ของ `LIKE` ราว 50 ไบต์ ทำให้คำค้นไทย 17 ตัวอักษรขึ้นไปล้ม)
- `province`/`district` ต้องตรงทุกตัวอักษรกับค่าไทยที่เก็บ (เช่น `กรุงเทพมหานคร`)
- `minPrice`/`maxPrice` เทียบกับ `starting_price` ของโครงการ (ไม่เทียบทุกห้อง) และ `minPrice ≤ maxPrice`
- `bedrooms` = โครงการมีห้อง `available` ที่จำนวนห้องนอนตรง
- `sort`: `recommended` (ค่าเริ่มต้น: โครงการแนะนำก่อน แล้วตาม id), `price_asc`, `price_desc`, `newest`

**รูปแบบ error เดียว** `{ "error": { "code", "message" } }` ข้อความเป็นภาษาอังกฤษสั้นๆ ไม่รั่วรายละเอียดภายใน และไม่ echo ค่าที่ผู้ใช้ส่งมา

| สถานะ | `code` | เมื่อไหร่ |
|---|---|---|
| 400 | `VALIDATION_ERROR` | id/พารามิเตอร์รูปผิด (id ต้องเป็นจำนวนเต็มบวกไม่เกิน 10 หลัก ไม่รับ `1e3`, `0x10`, `1.5`) |
| 404 | `NOT_FOUND` | id ถูกรูปแต่ไม่มีอยู่ หรือไม่มี route |
| 405 | `METHOD_NOT_ALLOWED` | เมธอดที่ไม่ใช่ GET/HEAD/OPTIONS (พร้อม `Allow`) |
| 500 | `INTERNAL` | ข้อผิดพลาดที่ไม่คาดคิด (รายละเอียดอยู่ใน log ของ Worker เท่านั้น) |
| 503 | `UNAVAILABLE` | ฐานข้อมูลใช้ไม่ได้ (เฉพาะ `/api/health`) |

**CORS:** อนุญาต `https://rawinan-txt.github.io` (ตัวแปร `ALLOWED_ORIGINS` ใน `wrangler.jsonc` แยกด้วย `,`) และ `http://localhost` / `http://127.0.0.1` ทุกพอร์ตเท่านั้น เทียบทั้งสตริง (`...github.io.evil.com` ไม่ผ่าน) เมธอด GET/HEAD/OPTIONS ไม่มี credentials
**แคช:** ข้อมูลสาธารณะ `Cache-Control: public, max-age=300, s-maxage=3600`; health และ error ทุกตัว `no-store`; ทุก response มี `X-Content-Type-Options: nosniff`
ไม่ทำระบบจำกัดจำนวน request (สเปกข้อ 13.4)

## วิธีรันในเครื่อง (ไม่ต้องมีบัญชี Cloudflare)

```bash
npm install
npm run db:reset      # สร้างฐานข้อมูล D1 ในเครื่อง (apps/api/.wrangler/state) แล้วใส่ข้อมูลจำลอง 1,846 ห้อง
npm run api:dev       # API ที่ http://localhost:8788
echo "VITE_API_URL=http://localhost:8788" > apps/web/.env.local
npm run dev -w web    # เว็บ (ไม่มี .env.local = ใช้ข้อมูลสำรอง)
npm test              # shared + api + web
npm run e2e           # เตรียมฐานข้อมูลใหม่ + build + Playwright (พอร์ตเปลี่ยนได้ด้วย E2E_PORT / E2E_API_PORT)
npm run gen           # สร้าง fallback.json และ seed.sql ใหม่จาก packages/shared (มี test บังคับให้ตรงกัน)
```

## โควตาฟรีของ Cloudflare และสิ่งที่ต้องวัดตอน deploy

ตรวจจากเอกสาร Cloudflare เมื่อ 2026-11-09:
- **D1 ฟรี:** อ่าน 5 ล้านแถว/วัน (นับแถวที่สแกน ไม่ใช่แถวที่คืน) · เขียน 100,000 แถว/วัน · 500 MB ต่อฐานข้อมูล · 50 query ต่อ request · 100 bound parameters ต่อ query
- **Workers ฟรี:** 100,000 request/วัน · CPU 10 ms ต่อ request
- การออกแบบ: SQL ชุดเดียวต่อ endpoint (`db.batch`, ไม่เกิน 4 statement ต่อ request มี test นับ), มี index ตามที่ query ใช้, `Cache-Control` ลดการอ่านซ้ำ, ไม่ parse ทีละแถวด้วย zod
- **seed 1 รอบเขียนราว 12,000+ แถว (รวม index) อย่า seed ฐานข้อมูลจริงซ้ำหลายรอบ**
- ต้องวัดตอน deploy จริง (วัดในเครื่องไม่ได้): CPU ต่อ request ของ `/api/projects/:id/explorer` (ในเครื่อง ~223 KB ก่อนบีบอัด ตอบ ~40 ms), `cf-cache-status` บน `*.workers.dev` (เอกสารไม่ยืนยันว่า Cache API ทำงานบนโดเมนนี้), จำนวนแถวที่อ่านต่อวัน
