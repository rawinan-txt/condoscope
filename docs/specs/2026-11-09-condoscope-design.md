# CondoScope — Design Spec (v1)

> สถานะ: **รอผู้ใช้ตรวจ** · วันที่ 2026-11-09
> เอกสารนี้ต่อยอดจาก `docs/original-spec.md` (Project Source of Truth เดิม)
> **กรณีที่ขัดกัน ให้ยึดเอกสารนี้** ส่วนเรื่องที่เอกสารนี้ไม่ได้พูดถึง ให้ยึดสเปกเดิม

---

## 1. เป้าหมายและเกณฑ์สำเร็จ (ยืนยันกับผู้ใช้แล้ว)

- เว็บ Full-stack สำหรับ **Portfolio นักพัฒนา** เปิดผ่านลิงก์สาธารณะได้ และใช้งบ 0 บาท
- **เกณฑ์สำเร็จข้อหลัก:** ผู้ใช้เลือกห้องจากตัวตึกได้จริง และข้อมูลที่แสดงตรงกับห้องที่เลือก
- **การแบ่งน้ำหนักงาน:** ให้ "ระบบครบและแข็งแรง" มาก่อน "ภาพสวยระดับภาพถ่าย" หน้าตาต้องดูดีระดับมืออาชีพ แต่ไม่ทำ pipeline ภาพ render แบบ offline ในเวอร์ชันนี้
  - สันนิษฐานว่าผู้ใช้สมัครงานสาย Full-stack/Frontend (ผู้ใช้ยังไม่ได้ระบุ)

## 2. การตัดสินใจที่เปลี่ยนจากสเปกเดิม

| หัวข้อ | สเปกเดิม | ใหม่ | เหตุผล |
|---|---|---|---|
| Building Explorer | ภาพนิ่ง + SVG polygon | **3D real-time (React Three Fiber)** สร้างตึกจากข้อมูล + มี **SVG 2D fallback** ที่สร้างจากข้อมูลชุดเดียวกัน | ผู้ใช้ต้องการให้หมุนดูได้ทั้งตึก polygon ตรงกับห้อง 100% เพราะสร้างจากข้อมูลเดียวกัน ไม่ต้องวาดเอง |
| ตารางพิกัดห้อง | `building_views` + `unit_polygons` | **พารามิเตอร์รูปทรงตึก** ใน `buildings` + `facade`/`bay_index` ใน `units` | ตำแหน่งห้องคำนวณได้จากข้อมูล ไม่ต้องเก็บ polygon |
| การจอง | Out of scope | **การจองจำลอง (Demo)** ฝั่ง client เท่านั้น | ทำให้เห็น flow ครบ แต่ยังไม่เป็นระบบจองจริง |
| แผนที่ | MapLibre + tile ฟรี | MapLibre + **OpenFreeMap (style Liberty, มีตึก 3D จาก OSM)** | ฟรี ไม่มี key ไม่จำกัด request และวางโครงการบนทำเลจริงที่มีตึกจริงรอบๆ |
| Routing | ยังไม่ระบุ | **HashRouter** | refresh หน้าใดบน GitHub Pages ก็ไม่ 404 |

ต้นแบบที่ผู้ใช้ทดลองแล้วและพอใจ: `prototype/building-3d/` (โค้ดทิ้งได้ ใช้เป็นตัวอ้างอิงหน้าตาและพฤติกรรมเท่านั้น)

## 3. สถาปัตยกรรม

```
GitHub Pages (React + Vite + TS + Tailwind + shadcn/ui)
  ├─ หน้า Home / Search / Map / Project / Building Explorer / Unit
  ├─ services/api.ts  ── HTTPS REST ──>  Cloudflare Worker (Hono)  ──>  D1
  └─ data/fallback.json  (ใช้เมื่อ API ล่ม แสดงแบนเนอร์ "Demo Fallback Mode")
packages/shared  ── ตัวสร้างข้อมูลแบบ deterministic ──>  database/seeds/*.sql  และ  apps/web/src/data/fallback.json
```

- **แหล่งข้อมูลเดียว:** `packages/shared/src/generate.ts` สร้างข้อมูลทั้งหมดจาก seed คงที่ แล้วส่งออกเป็นทั้ง seed SQL และ fallback JSON ข้อมูลสองชุดจึงตรงกันเสมอ (มี test ยืนยัน)
- Types ของ API ใช้ร่วมกันใน `packages/shared/src/types.ts`
- โครงสร้าง repo ตามสเปกเดิมข้อ 13 (npm workspaces)

## 4. Interactive Building Explorer (ฟีเจอร์หลัก)

### 4.1 การสร้างตึก
- ตึกถูกสร้างจากข้อมูล `buildings` + `units` ทั้งหมด: ทาวเวอร์มีห้องสองแถว (front/back) คั่นด้วยทางเดิน ความกว้างของแต่ละช่องห้อง (bay) มาจาก `unit_bay_widths`
- ห้องแต่ละห้องเป็น instance หนึ่งใน `InstancedMesh` และผูกกับ `unit.id` (หลายร้อยห้องยังลื่น)
- องค์ประกอบ: โพเดียมที่จอดรถ, สวนและสระบนดาดฟ้าโพเดียม, ระเบียง, ขอบพื้นชั้น, ยอดตึก, เมืองจำลองรอบๆ, ถนนและทางด่วนที่มีไฟรถวิ่ง

### 4.2 ความสมจริง (อัปเกรดจากต้นแบบ)
1. **Interior mapping shader:** มองผ่านกระจกแล้วเห็นห้องที่มีความลึก (ผนัง เพดาน ม่าน โคมไฟ) สุ่มต่างกันในแต่ละห้อง
2. รายละเอียดผนังตึก: เส้นกรอบกระจก, แผงผนังทึบ, ครีบแนวตั้ง, ราวระเบียงกระจกขอบโลหะ
3. แสงจาก HDRI แบบ CC0 (มีชุดพลบค่ำและกลางวัน) ต้องตรวจ license และขนาดไฟล์ก่อนใช้
4. Ambient occlusion และเงานุ่ม ปรับระดับลงอัตโนมัติบนมือถือ
5. โพเดียมและภูมิทัศน์: ต้นไม้หลายทรง ไฟส่องต้นไม้ เฟอร์นิเจอร์ริมสระ
6. มีปุ่มสลับ พลบค่ำ / กลางวัน

### 4.3 การโต้ตอบ
- **Desktop:** ลากเพื่อหมุน, เลื่อนล้อเพื่อซูม, ชี้ห้องแล้วไฮไลต์พร้อม tooltip (เลขห้อง ชั้น ราคา พื้นที่ ห้องนอน ห้องน้ำ สถานะ), คลิกเพื่อเปิดแผงรายละเอียด แล้วมีปุ่มไปหน้า Unit Detail
- **Mobile:** ลากนิ้วเพื่อหมุน, บีบนิ้วเพื่อซูม, แตะห้องเพื่อเลือก (ไม่มี hover) แผงรายละเอียดเป็น bottom sheet
- **คีย์บอร์ด:** ลูกศรเลื่อนไปห้องข้างๆ หรือชั้นบนล่าง, Enter เปิดรายละเอียด, Esc ยกเลิก นอกจากนี้ Unit List และ Floor Selector เป็น HTML ปกติ ใช้กับ screen reader ได้
- **โหมดผ่าชั้น:** เลือกชั้นแล้วซ่อนทุกอย่างที่อยู่เหนือชั้นนั้น เห็นผังทั้งชั้นจากด้านบน มีสีตามสถานะ
- **โหมดสถานะ / ตัวกรอง:** ทั้งตึกเปลี่ยนสีตามสถานะ และกรองตามราคาหรือจำนวนห้องนอนให้ห้องที่ตรงเงื่อนไขสว่างขึ้นได้ มี Legend และข้อความกำกับ ไม่ใช้สีอย่างเดียว
- **Hover ทำงานฝั่ง client ล้วนๆ:** โหลดข้อมูลทั้งอาคารครั้งเดียว ใช้ raycast ต่อเฟรมเฉพาะตอนเมาส์ขยับ และอัปเดตเฉพาะ instance ที่เปลี่ยน

### 4.4 Fallback
- ถ้าเครื่องไม่รองรับ WebGL หรือ context หลุด ให้ใช้ **SVG ภาพด้านหน้าตึก (front / back)** ที่สร้างจากข้อมูลเดียวกัน ใช้ฟีเจอร์ hover / click / tooltip / สถานะ ได้เหมือนเดิม
- โหลดโค้ด 3D แบบ lazy เฉพาะในหน้า Explorer หน้าอื่นไม่ต้องโหลด three.js

### 4.5 การจองจำลอง (Demo)
- ปุ่ม "จองห้องนี้ (Demo)" ใช้ได้เฉพาะห้องที่ `available` กดแล้วสถานะในเบราว์เซอร์นั้นเปลี่ยนเป็น reserved ทันที
- เก็บใน `localStorage` (ครอบ try/catch) **ไม่เก็บชื่อ เบอร์ หรืออีเมล** และไม่ส่งไป backend ยกเลิกได้
- UI ระบุชัดว่าเป็นการสาธิต และแยกสถานะ "คุณจอง (Demo)" ออกจากสถานะจริงใน DB

## 5. ข้อมูลโครงการ

- 5 โครงการจำลองบนทำเลจริง ใช้ชื่อโครงการที่คิดขึ้นเอง (ห้ามใช้ชื่อ ภาพ หรือแปลนของโครงการจริง)
- **Featured:** "Noventa Ari" (ชื่อสมมติ) ย่านอารีย์ พญาไท กรุงเทพฯ มี 2 ทาวเวอร์บนโพเดียม (A: ชั้น 7–38, B: ชั้น 7–30) ประมาณ 600 ห้อง
- อีก 4 โครงการ: มีข้อมูลค้นหาได้ อยู่บนแผนที่ และมีหน้ารายละเอียด ใช้ schema เดียวกัน จึงเปิด Explorer ภายหลังได้แค่เติมข้อมูล
- **ความสมจริงของข้อมูล:** ขนาดห้องตามแบบที่ขายในไทย (สตูดิโอ ~22–27, 1 นอน ~28–40, 2 นอน ~45–65 ตร.ม.) ราคาต่อ ตร.ม. อิงช่วงราคาตลาดของแต่ละย่าน (**ต้องค้นข้อมูลตลาดล่าสุดตอนสร้างข้อมูล**) ปรับตามชั้น ห้องมุม และทิศ
- **Floor plan:** สร้างเป็น SVG จากขนาดห้องและประเภทห้อง (เทมเพลตต่อประเภท) จุด hotspot ใช้พิกัด % บนแปลน
- **ภาพภายในห้อง:** ใช้ชุดภาพต่อประเภทห้อง (ห้องนั่งเล่น ห้องนอน ครัว ห้องน้ำ ระเบียง) แล้วใช้ซ้ำกับห้องประเภทเดียวกัน ⚠️ **ยังต้องตัดสินใจ:** ให้ผู้ใช้ gen ภาพ AI เอง (แนะนำ) หรือ render ห้อง 3D แบบ procedural ระหว่างนี้ใช้ placeholder ที่มีป้ายกำกับ
- ทุกหน้ามีข้อความ "ข้อมูลจำลองเพื่อการสาธิต ไม่มีการขายจริง"

## 6. Database (Cloudflare D1)

คงตารางตามสเปกเดิม ยกเว้นส่วนที่เปลี่ยนต่อไปนี้:

- `buildings` เพิ่ม: `first_res_floor`, `last_res_floor`, `podium_floors`, `floor_height_m`, `footprint_depth_m`, `corridor_width_m`, `unit_bay_widths` (JSON array), `origin_x_m`, `origin_z_m`, `rotation_deg`, `has_explorer` (0/1)
- `units` เพิ่ม: `facade` (`front`|`back`), `bay_index` (int), `unit_type` (`studio`|`1br`|`2br`|`2br_plus`)
  - UNIQUE (`building_id`, `floor_id`, `facade`, `bay_index`) และ UNIQUE (`building_id`, `unit_number`)
  - CHECK กับ `status`, `facade`, `area_sqm > 0`, `price > 0`
- **ตัด** `building_views` / `unit_polygons` ออกจาก v1 (เพิ่มกลับได้ในเฟสภาพ render)
- Index: `projects(province, starting_price)`, `units(building_id, floor_id)`, `units(building_id, status)`
- มี migrations ใน `database/migrations/` และไฟล์ seed ที่สร้างจาก `packages/shared`

## 7. REST API (Hono บน Workers, อ่านอย่างเดียว)

ตาม endpoint ในสเปกเดิมข้อ 8 บวกเพิ่ม:
- `GET /api/buildings/:id/explorer` คืนพารามิเตอร์รูปทรง + ห้องทั้งหมด (ฟิลด์ที่ต้องใช้กับ tooltip) **ใน request เดียว**
- ใช้ `zod` ตรวจ query/params, parameter binding ทุก query, error รูปแบบเดียว `{ error: { code, message } }`, CORS อนุญาตเฉพาะ origin ของ GitHub Pages และ localhost, header `Cache-Control` สำหรับข้อมูลสาธารณะ
- ไม่มี endpoint เขียนข้อมูล (การจองเป็น client-only)

## 8. Frontend อื่นๆ

- หน้าตามสเปกเดิมข้อ 10 ใช้ HashRouter ตั้ง Vite `base` เป็น `/condoscope/`
- UI: โทนกลาง (white/slate) มี accent สีเดียวคือน้ำเงิน `#2563eb` ใช้ฟอนต์ IBM Plex Sans Thai (Google Fonts)
- Map Explorer: OpenFreeMap Liberty, หมุด 5 โครงการ, popup, รายการด้านข้างบน desktop, สลับ แผนที่/รายการ บนมือถือ, attribution ของ OpenStreetMap/OpenFreeMap ต้องมองเห็นได้ ถ้าโหลด tile ไม่ได้ให้แสดงรายการพร้อมข้อความแจ้ง
- ทุกการเรียก API มี loading / empty / error state ถ้า API ล่มให้ใช้ fallback JSON พร้อมแบนเนอร์บอก

## 9. การทดสอบ

- **Vitest:** ตัวสร้างข้อมูล (deterministic, seed SQL ตรงกับ fallback, ไม่มีห้องซ้ำตำแหน่ง), การคำนวณตำแหน่งห้องจากพารามิเตอร์, validation ของ API, route handler กับ D1 (ใช้ Miniflare/`@cloudflare/vitest-pool-workers`)
- **Playwright smoke:** เปิดทุกหน้า, hover/click ห้องแล้วข้อมูลตรงกับ unit ID, ทดสอบ fallback mode, ถ่ายภาพหน้าจอสำหรับ README
- **เกณฑ์สำเร็จข้อหลักทดสอบอัตโนมัติ:** project ห้องสุ่มลงจอ → คลิก → ตรวจว่าแผงแสดง `unit_number` ที่ตรงกัน

## 10. ลำดับการพัฒนา

1. Scaffold monorepo + `packages/shared` (types, ตัวสร้างข้อมูล, test)
2. **Building Explorer 3D** ด้วย fallback JSON (ฟีเจอร์หลัก ทำก่อน) + SVG fallback + Unit List
3. Unit Detail + Floor plan SVG + hotspots + image viewer
4. Worker + D1 (migrations, seed, endpoints, tests) และเชื่อมกับ frontend
5. Home / Search / Project Detail
6. Map Explorer
7. Deploy (GitHub Actions → Pages, wrangler → Workers/D1), README, ภาพหน้าจอ

## 11. นอกขอบเขต v1 (เพิ่มภายหลังได้)

ภาพ render แบบ offline หลายมุม (beauty layer), ระบบจองจริง, auth/admin, และส่วนอื่นตามสเปกเดิมข้อ 20

## 12. เรื่องที่ต้องทำก่อน deploy (ฝั่งผู้ใช้)

- สร้างบัญชี Cloudflare แบบฟรี (ไม่ต้องผูกบัตร) แล้วสร้าง API token สำหรับ GitHub Actions
- เปิดใช้ GitHub Pages ของ repo
