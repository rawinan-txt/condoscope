# Plan 3 — หน้าเว็บค้นหา, แผนที่, Deploy และ README

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เปลี่ยนเว็บจาก "ตึก 3D + หน้าชั่วคราว" เป็นเว็บหาคอนโดครบทางเดิน (หน้าแรกแบบค้นหา → ผลค้นหา → หน้าโครงการ → ตึก 3D → ห้อง) มีแผนที่ (MapLibre + OpenFreeMap) และเตรียม deploy ขึ้น GitHub Pages + Cloudflare Workers/D1 พร้อม README

**Architecture:** ทุกหน้าอ่านข้อมูลผ่าน `services/api.ts` เดิม (live-first, fallback มีแบนเนอร์) ผ่าน hook กลาง `useResource` ที่กันคำตอบเก่า; พารามิเตอร์ค้นหาผ่านตัวล้างค่า `sanitizeSearchParams` ใน `packages/shared` ที่รับประกันว่า API ไม่ปฏิเสธ; แผนที่และ 3D แยก chunk โหลดเมื่อเข้าหน้านั้นเท่านั้น; workflow ของ GitHub Actions ทำ CI, deploy API, deploy เว็บ และ seed ฐานข้อมูลแบบกดเอง

**Tech Stack:** React 19, React Router 8 (HashRouter), Tailwind 4, lucide-react, maplibre-gl 6, Playwright + `@axe-core/playwright`, `yaml` (เฉพาะ test ของ workflow), GitHub Actions (`checkout@v7`, `setup-node@v7`, `configure-pages@v5`, `upload-pages-artifact@v4`, `deploy-pages@v4`, `cloudflare/wrangler-action@v4`) — เวอร์ชัน Actions ตรวจจากเอกสารเมื่อ 2026-11-09

**Spec:** `docs/specs/2026-11-09-condoscope-design.md` (ข้อ 5, 8.1, 8.2, 10 ขั้น 5–7, 12, 13.12 และ 13.11 เรื่องภาพ) + `docs/original-spec.md` ข้อ 10 หน้า 1–3, 14–19 · **งานรอบ UX/UI (Explorer เต็มจอ ฯลฯ) ไม่อยู่ในแผนนี้** (CLAUDE.md ห้ามเริ่มเอง)

**ก่อนเริ่ม:** PR ของแผน 2 ต้องถูก merge เข้า `main` แล้ว แล้วแตก `feat/plan-3` จาก `main`

## ตัดสินใจแทนผู้ใช้ — ขอให้ตรวจก่อนอนุมัติ

| # | เรื่อง | ที่เลือก | เหตุผล / ถ้าไม่เห็นด้วย |
|---|---|---|---|
| 1 | **ช่องโหว่จากแผน 1 ที่เจอตอนเตรียมแผนนี้** | Task 1 แก้ 2 อย่าง: ย้ายโฟลเดอร์ภาพเป็น `images/interiors/…` ตามสเปกข้อ 5 (แผน 1 ใช้ `images/units/…` ตามสเปกเดิม) และเพิ่มป้าย "ภาพประกอบสร้างด้วย AI" ที่สเปกบังคับแต่ยังไม่มีในเว็บ | สเปกคืออำนาจสูงสุด; ฐานข้อมูลจริงยังไม่ถูก seed จึงไม่มีผลกับข้อมูลที่ deploy แล้ว |
| 2 | shadcn/ui | ไม่ใช้ (Tailwind + element มาตรฐาน) ตามที่ทำมาตั้งแต่แผน 1; README จะเขียนตามจริง | สเปกเดิมระบุ shadcn/ui แต่ไม่มีหน้าใดต้องใช้; ถ้าอยากได้ ให้บอก จะเป็นงานแยก |
| 3 | ภาพโครงการ | ถ่ายภาพหน้าจอตึก 3D ช่วงพลบค่ำของทั้ง 5 โครงการเก็บเป็นไฟล์ `images/projects/<slug>.jpg` แล้วใส่ใน `thumbnail_url` (สเปกข้อ 13.9, 8.1) | ไม่ต้องมีภาพจริงจากภายนอก; ทุกโครงการมี Explorer ตามข้อ 13.13 |
| 4 | ชิปทำเลยอดนิยม | ใช้ย่านของ 5 โครงการที่มีจริง (อารีย์ อ่อนนุช แคราย รังสิต ปากน้ำ) | สเปกยกตัวอย่าง "อารีย์ บางซื่อ อ่อนนุช" แต่ไม่มีโครงการที่บางซื่อ ชิปที่ค้นแล้วไม่เจอจะดูแย่ |
| 5 | ตัวกรองบนมือถือ | แผงที่เปิด/ปิดได้ด้วยปุ่ม "ตัวกรอง" (`aria-expanded`) ไม่ใช่ drawer เลื่อนเข้า | สเปกข้อ 8.1 พูดว่า drawer; แผงแบบนี้ใช้งานได้เหมือนกันและไม่ต้องจัดการ focus trap เอง |
| 6 | หน้ารายการจอง (Demo) | เพิ่มหน้า `/reservations` แบบเล็ก (ลิงก์ใน Navbar เมื่อมีการจองตามข้อ 8.1) | สเปกกำหนดลิงก์แต่ไม่กำหนดหน้า; ไม่มีหน้า ลิงก์จะไปไหนไม่ได้ |
| 7 | หมุดบนแผนที่ | popup มีข้อมูลเบื้องต้น + ลิงก์ไป**หน้าโครงการ** (ตามทางเดินหลักข้อ 8.1) ไม่ไปตึก 3D ตรงๆ | การเปลี่ยนเป็นไป Explorer ตรงๆ เป็นของ "งานรอบ UX/UI" ที่ผู้ใช้สั่งแยกไว้ |
| 8 | ข้อความเครดิตแผนที่ | เพิ่มบรรทัดเครดิตของเราเองใต้แผนที่เสมอ (OpenFreeMap © OpenMapTiles ข้อมูลจาก OpenStreetMap) นอกเหนือจากที่ MapLibre ใส่ให้ | สเปกสั่งให้เครดิต "ต้องมองเห็นได้"; ถ้า style โหลดไม่ขึ้น ตัวของ MapLibre จะไม่มี |
| 9 | Test เชิงการเข้าถึง | เพิ่ม axe (Playwright) ตรวจหน้าหลัก ต้องไม่มีปัญหาระดับ serious/critical | สเปกข้อ 15 + งาน QA ของผู้ใช้ |
| 10 | Workflow | `ci.yml` (test + build ทุก PR; e2e เฉพาะ push เข้า `main`), `deploy-api.yml`, `deploy-web.yml` ทำงานเมื่อ push เข้า `main`; `seed-db.yml` กดเองเท่านั้น (ต้องพิมพ์ยืนยัน) | seed เขียน ~12,000 แถว เทียบเพดานฟรี 100,000/วัน จึงไม่ให้ทำอัตโนมัติ |
| 11 | ส่วน "บทบาทของฉันและการใช้ AI" ใน README | เว้นหัวข้อว่างพร้อมคอมเมนต์ให้ผู้ใช้เขียนเอง | CLAUDE.md กำหนดให้ผู้ใช้เขียนด้วยคำของตัวเอง |

## ข้อเท็จจริงของบริการภายนอก (ตรวจจากเอกสาร 2026-11-09)

- **OpenFreeMap:** style `https://tiles.openfreemap.org/styles/liberty`; ไม่ต้องสมัคร ไม่มี API key; ไม่จำกัดจำนวนการดูแผนที่; ใช้เชิงพาณิชย์ได้; MapLibre ใส่เครดิตให้อัตโนมัติ (ต้องมองเห็นได้); ToS (อัปเดต 2026-10-14) ไม่ให้เก็บข้อมูลอัตโนมัติ (ยกเว้นดาวน์โหลดออฟไลน์ ≤ 3,000 tile หรือ 50 MB), **ไม่มี SLA และเลิกให้บริการได้ทุกเมื่อ** → แผนที่ต้องมีทางสำรองเป็นรายการเสมอ · **ผู้ที่เชื่อมใช้ต้องอายุ ≥ 18 ปี** ตาม ToS (ให้ผู้ใช้ยืนยันเอง)
- **MapLibre GL JS v6:** ES module อย่างเดียว; ใน Vite ต้อง `import 'maplibre-gl/dist/maplibre-gl.css'` และ `import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'` แล้วเรียก `setWorkerUrl(workerUrl)`; `Popup.setHTML` ไม่กรองข้อความ (ใช้ DOM + `textContent` แทน)
- **ที่เอกสารยังไม่ยืนยัน (ให้ผู้ปฏิบัติตรวจจากชนิดข้อมูลใน `node_modules/maplibre-gl` หรือเอกสารก่อนใช้):** ชื่อ option ของ `Marker` ที่รับ element ของเราเอง, ชื่อ event `error` ของแผนที่, ฟังก์ชันตรวจว่ารองรับ WebGL
- **ที่ยังตรวจไม่ได้ ต้องดูตอนทำจริง:** การสมัคร Cloudflare แบบฟรีต้องผูกบัตรหรือไม่ (เอกสารสามหน้าไม่ได้บอก → **ถ้าระบบขอบัตร ให้หยุดและแจ้งผู้ใช้**), ชื่อสิทธิ์ของ D1 ใน API token (เอกสารมีเฉพาะเทมเพลต "Edit Cloudflare Workers"), รูปแบบผลลัพธ์ของ `wrangler d1 create`, การเปิด Pages แบบ source = GitHub Actions, ไวยากรณ์ `vars.X` ของ Actions

## สิ่งที่ผู้ใช้ต้องทำเอง (ผู้ปฏิบัติต้องหยุดถามที่ Task 11 และห้ามขอ token ในแชท)

1. สมัคร Cloudflare แบบฟรี และสร้าง API token (สิทธิ์: Edit Cloudflare Workers + แก้ไข D1; จำกัดไว้ที่บัญชีเดียว)
2. ตั้ง **secrets** ใน GitHub repo: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
3. สั่ง `wrangler d1 create condoscope` ในเครื่องตัวเอง (ใช้ token ผ่านตัวแปรสภาพแวดล้อมของ shell ไม่ commit) แล้วส่ง `database_id` ให้ผู้ปฏิบัติใส่ใน `apps/api/wrangler.jsonc` (ไม่ใช่ความลับ)
4. หลัง deploy API ครั้งแรก ตั้ง **variable** `VITE_API_URL` ของ repo เป็นที่อยู่ `*.workers.dev` ที่ได้
5. เปิด GitHub Pages ของ repo โดยเลือก source = **GitHub Actions**
6. ยืนยันเงื่อนไขอายุของ OpenFreeMap (ข้างบน)

## Global Constraints

- งบ 0 บาท: free tier และ open source เท่านั้น ห้ามบริการที่ต้องผูกบัตร
- ห้ามใช้ชื่อ ภาพ หรือแปลนของโครงการคอนโดจริง; ทุกหน้ามี "ข้อมูลจำลองเพื่อการสาธิต ไม่มีการขายจริง"; ภาพ AI ต้องมีป้าย "ภาพประกอบสร้างด้วย AI"
- **หน้าแรก (`/`) ต้องเป็นหน้าค้นหาคอนโด** (Hero + ช่องค้นหา + การ์ดโครงการ) ห้ามเปิดมาเจอแผนที่ หน้าโครงการ หรือตึก 3D; **ห้ามโหลด three.js ในหน้าแรก** (และห้ามโหลด maplibre นอกหน้า `/map`)
- ห้ามแสดงข้อมูล fallback ว่าเป็น live; ห้ามมี secret ใน frontend (`VITE_*` เป็น URL สาธารณะเท่านั้น); ทุก SQL ใช้ parameter binding (ไม่มี SQL ใหม่ในแผนนี้)
- UI ภาษาไทย สกุลเงิน THB; โทนกลาง white/slate; accent เดียว `#2563eb`; ฟอนต์ IBM Plex Sans Thai; ไม่ใช้ gradient/animation เกินจำเป็น
- HashRouter, Vite `base: '/condoscope/'`; ทุกการเรียก API มี loading / empty / error state
- เข้าถึงได้: label ครบ, focus เห็นชัด, contrast พอ, สถานะไม่สื่อด้วยสีอย่างเดียว, ใช้คีย์บอร์ดได้ (รวมหมุดแผนที่)
- แผนที่: attribution ของ OpenStreetMap/OpenFreeMap ต้องมองเห็นได้; โหลด tile/style ไม่ได้ → แสดงรายการพร้อมข้อความแจ้ง
- Navbar: โลโก้ · ค้นหาคอนโด · แผนที่ · (ถ้ามี) รายการที่จองไว้ (Demo)
- ทำงานบน branch `feat/plan-3`; ทุก commit ลงท้ายด้วยบรรทัด `Co-Authored-By` ที่ระบบกำหนดให้ในตอนนั้น

## Review Focus

1. **URL ค้นหาที่เป็นขยะ:** `/search?minPrice=abc&maxPrice=1&minPrice=5&limit=999&bedrooms=9&sort=x&q=<ยาว 500 ตัว>` → หน้าแสดงผลลัพธ์ (ค่าถูกล้างแล้ว) ไม่ใช่ "ไม่พบข้อมูล" ไม่ใช่หน้าขาว → Task 2 (ล้างค่า + fuzz กับ API จริง) และ Task 6
2. **แผนที่ใช้ไม่ได้:** style/tile เข้าไม่ถึง, ไม่มี WebGL, OpenFreeMap ปิดบริการ → แสดงรายการ + ข้อความ ไม่ค้างว่าง ไม่พัง; หมุดกดด้วยคีย์บอร์ดได้ → Task 8 และ Task 9
3. **หน้าโครงการ:** `/project/999999` → ไม่พบข้อมูล; โครงการที่ไม่มีห้องว่างประเภทใด → บอก "ไม่มีห้องว่าง" ปุ่มไปตึกยังใช้ได้ → Task 7
4. **ค้นหาจากหน้าแรกด้วยข้อความแปลก:** ไทย, อักขระพิเศษ, ว่างเปล่า → ไปหน้าค้นหาและแสดงผลถูก (ว่าง = ทุกโครงการ) → Task 5 และ Task 6
5. **Production บน GitHub Pages:** ลิงก์ภาพ/HDRI อยู่ใต้ `/condoscope/`, refresh ที่ `#/project/3` ได้, chunk ของหน้าแรกไม่มี three/maplibre → Task 10 และ Task 11

---

## File Structure

```
.github/workflows/{ci.yml,deploy-api.yml,deploy-web.yml,seed-db.yml}
scripts/smoke-live.mjs                 # วัด API จริงหลัง deploy (status, cache, เวลา, CORS)
packages/shared/src/searchParams.ts    # sanitizeSearchParams, toQueryRecord
packages/shared/test/{searchParams,repo}.test.ts   # repo.test = ตรวจ workflow (ไม่มี secret ฝัง, สิทธิ์น้อยที่สุด)
apps/api/test/search-sanitize.test.ts
apps/web/
  public/images/projects/<slug>.jpg    # ภาพหน้าจอ 3D (Task 3)
  public/images/interiors/…            # ย้ายจาก images/units (Task 1)
  scripts/{capture-thumbnails,screenshots,check-bundles}.mjs
  src/hooks/useResource.ts
  src/components/{Navbar,Footer,ProjectCard,AmenityIcon,AiBadge}.tsx
  src/features/home/{HomePage,Hero}.tsx
  src/features/search/{SearchPage,FiltersPanel}.tsx
  src/features/project/{ProjectPage,Gallery,Availability}.tsx
  src/features/map/{MapPage,MapView,geo}.ts(x)
  src/features/reservations/ReservationsPage.tsx
  e2e/journeys.spec.ts
README.md, docs/architecture.md (เพิ่มส่วนหน้าเว็บ/deploy), CLAUDE.md
```

---

### Task 1: แก้ให้ตรงสเปกข้อ 5 — โฟลเดอร์ภาพและป้าย "ภาพประกอบสร้างด้วย AI"

**Files:**
- Modify: `packages/shared/src/generate.ts` (path ของ `unit_type_images.image_url`), `packages/shared/test/generate.test.ts`, `apps/web/src/data/images.test.ts`, `apps/web/src/features/unit/ImageViewer.tsx`, `apps/web/src/features/unit/UnitPage.test.tsx`
- Create: `apps/web/src/components/AiBadge.tsx`
- Move: `apps/web/public/images/units/` → `apps/web/public/images/interiors/` (ใช้ `git mv`); สร้าง `fallback.json`/`seed.sql` ใหม่ด้วย `npm run gen`

**Interfaces — Produces:**
```ts
// components/AiBadge.tsx — ป้ายมุมภาพ
export default function AiBadge(): JSX.Element;   // ข้อความตายตัว "ภาพประกอบสร้างด้วย AI" (อ่านได้ด้วย screen reader ไม่ซ่อนด้วย aria-hidden)
```
`image_url` ใหม่ = `images/interiors/${imageFile(type, room)}.webp` (ฟังก์ชัน `imageFile` เดิมไม่เปลี่ยน)

- [ ] **Step 1: Write the failing tests:** ใน `generate.test.ts` ทุก `image_url` ขึ้นต้นด้วย `images/interiors/` และมี 17 ไฟล์ต่างกัน; ใน `UnitPage.test.tsx` หน้าห้องที่แสดงภาพมีข้อความ "ภาพประกอบสร้างด้วย AI" (`getByText`); `images.test.ts` เดิมยังตรวจว่าไฟล์ของทุกแถวมีจริงใน `public/`
- [ ] **Step 2:** `npm test` → FAIL (path เดิมยังเป็น `images/units`, ยังไม่มีป้าย)
- [ ] **Step 3:** `git mv` โฟลเดอร์, แก้ `generate.ts`, เขียน `AiBadge`, ใส่ใน `ImageViewer` (มุมภาพ; ไม่ใส่ตอนแสดง placeholder "รอภาพจริง"), รัน `npm run gen`; ค้นหาข้อความ `images/units` ใน repo (`docs/`, `CLAUDE.md`, `docs/image-prompts.md`) แล้วแก้ให้เป็น `images/interiors` เฉพาะที่เป็นเอกสารของเรา (ไม่แตะ `docs/specs`)
- [ ] **Step 4:** `npm test` → PASS ทั้งหมด; `npm run build -w web` ผ่าน
- [ ] **Step 5:** Commit `fix: align interior image folder with spec and add the AI-image label`

---

### Task 2: ตัวล้างพารามิเตอร์ค้นหา (กันค่าขยะก่อนถึง API)

**Files:**
- Create: `packages/shared/src/searchParams.ts`, `packages/shared/test/searchParams.test.ts`, `apps/api/test/search-sanitize.test.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces — Produces:**
```ts
export function sanitizeSearchParams(input: Record<string, string | undefined>): ProjectSearchParams;  // ไม่มีวันคืนค่าที่ API จะปฏิเสธ
export function toQueryRecord(p: ProjectSearchParams): Record<string, string>;                         // ตัดค่า undefined ออก ใช้สร้าง URLSearchParams
```
กติกา: `q` ตัดช่องว่าง แล้วตัดให้ ≤ 100 ตัว (ว่าง = ไม่ใส่) · `province`/`district` ตัดช่องว่าง ≤ 100 ตัว · `minPrice`/`maxPrice` ต้องเป็น `^\d{1,10}$` ไม่งั้นทิ้ง; ถ้า `minPrice > maxPrice` **สลับกัน** · `bedrooms` ∈ {0,1,2} ไม่งั้นทิ้ง · `sort` ต้องอยู่ในรายการ ไม่งั้นทิ้ง · `limit` จำนวนเต็มบีบให้อยู่ 1..`SEARCH_MAX_LIMIT` (ไม่ใช่ตัวเลข = ทิ้ง) · `offset` จำนวนเต็ม ≥ 0 ไม่งั้นทิ้ง

- [ ] **Step 1: Write the failing tests**
  - shared: ตาราง `it.each` — `{minPrice:'abc'}`→`{}`; `{minPrice:'5000000',maxPrice:'1000000'}`→ `{minPrice:1000000,maxPrice:5000000}`; `{limit:'999'}`→`{limit:50}`; `{limit:'0'}`→`{limit:1}`; `{bedrooms:'9'}`→`{}`; `{sort:'x'}`→`{}`; `{q:'  ari  '}`→`{q:'ari'}`; `{q:'x'.repeat(500)}`→ q ยาว 100; `{q:'   '}`→`{}`; `{offset:'-1'}`→`{}`; ค่า `undefined` ถูกข้าม; `toQueryRecord` ไม่มีคีย์ที่เป็น undefined และ round-trip กับ `sanitizeSearchParams`
  - api (`search-sanitize.test.ts`): รายการอินพุตแย่ ≥ 40 แบบ (ทุกตัวใน Review Focus ข้อ 1 + ตัวอักษรไทย/อีโมจิ/`%`/`'`/ค่ายาว/ตัวเลขใหญ่/ติดลบ) → `parseQuery(projectSearchQuery, toQueryRecord(sanitizeSearchParams(x)))` **ไม่โยน error** ทุกตัว
- [ ] **Step 2:** รัน `npm test -w @condoscope/shared` และ `-w api` → FAIL
- [ ] **Step 3:** เขียน `searchParams.ts` ตามกติกา แล้ว export
- [ ] **Step 4:** รันสองชุด → PASS
- [ ] **Step 5:** Commit `feat(shared): sanitize search parameters so the API never rejects them`

---

### Task 3: ภาพโครงการ (ภาพหน้าจอ 3D) และ `thumbnail_url`

**Files:**
- Create: `apps/web/scripts/capture-thumbnails.mjs`, `apps/web/public/images/projects/{noventa-ari,selvara-on-nut,kaelo-khae-rai,thalora-rangsit,marivo-paknam}.jpg`
- Modify: `packages/shared/src/generate.ts`, `packages/shared/test/generate.test.ts`, `apps/web/src/data/images.test.ts`, root `package.json` (script `thumbnails`)

**Interfaces — Produces:** `Project.thumbnail_url = "images/projects/<slug>.jpg"` (path สัมพัทธ์ ใช้คู่กับ `import.meta.env.BASE_URL` เหมือนภาพห้อง)

สคริปต์: build เว็บโดยไม่ตั้ง `VITE_API_URL` → `vite preview` พอร์ตที่ว่าง → Playwright (ใช้ flag SwiftShader เหมือน e2e, viewport 1600×900) เปิด `#/explorer/<id>` รอ `window.__condoscope` แล้วถ่ายเฉพาะ `canvas` เป็น JPEG คุณภาพ 80 ลงโฟลเดอร์ปลายทาง ปิด server เมื่อเสร็จ

- [ ] **Step 1: Write the failing tests:** `generate.test.ts` — ทุกโครงการ `thumbnail_url === 'images/projects/' + slug + '.jpg'`; `images.test.ts` — ไฟล์ของ `thumbnail_url` ทุกโครงการมีจริงใน `public/` และขนาด ≤ 300 KB
- [ ] **Step 2:** รัน → FAIL
- [ ] **Step 3:** แก้ `generate.ts`; เขียนสคริปต์; `npm run thumbnails`; **เปิดดูภาพอย่างน้อย 2 ภาพด้วยตา** ว่าเห็นตึกชัดไม่ว่างเปล่า; `npm run gen`
- [ ] **Step 4:** `npm test` → PASS
- [ ] **Step 5:** Commit `feat: project thumbnails captured from the 3D scene`

---

### Task 4: โครงเว็บ — hook `useResource`, Navbar, Footer, ProjectCard, ไอคอน, หน้ารายการจอง

**Files:**
- Create: `apps/web/src/hooks/useResource.ts`, `components/{Navbar,Footer,ProjectCard,AmenityIcon}.tsx`, `features/reservations/ReservationsPage.tsx` + test ของแต่ละไฟล์
- Modify: `components/Layout.tsx`, `features/explorer/reservations.ts` (เพิ่ม subscribe), `features/explorer/ExplorerPage.tsx`, `features/unit/UnitPage.tsx` (ใช้ `useResource` แทนโค้ดโหลดซ้ำ), `App.tsx` (route `/reservations`), `src/features/stale.test.tsx` (ต้องยังผ่าน)

**Interfaces — Produces:**
```ts
// hooks/useResource.ts
export type ResourceState<T> = { state: 'loading' } | { state: 'ok'; data: T } | { state: 'missing' } | { state: 'error'; retry(): void };
export function useResource<T>(fetcher: () => Promise<Result<T>>, deps: React.DependencyList): ResourceState<T>;
//  เรียก useReportSource() เมื่อสำเร็จ; NotFoundError → 'missing'; อย่างอื่น → 'error'; คำตอบของ request ที่ถูกแทนที่/หน้าที่ออกไปแล้วถูกทิ้ง (พฤติกรรมเดียวกับ stale.test.tsx)
// reservations.ts เพิ่ม
export function subscribeReservations(cb: () => void): () => void;   // saveReservations() เรียก cb ทุกครั้ง และเมื่อเกิด event 'storage'
// components
export default function ProjectCard(props: { project: Project }): JSX.Element;
export default function AmenityIcon(props: { name: string; className?: string }): JSX.Element;   // map ชัดเจน 8 ชื่อ: waves,dumbbell,trees,laptop,car,shield-check,plug-zap,washing-machine; ชื่ออื่น → ไอคอนเครื่องหมายถูก
```
- `Navbar`: โลโก้ → `/`, ลิงก์ "ค้นหาคอนโด" `/search`, "แผนที่" `/map`, "รายการที่จองไว้ (Demo)" `/reservations` พร้อมตัวเลขเมื่อ > 0 (ตัวเลข = จำนวน id ที่เก็บไว้ใน localStorage; หน้ารายการจองจะแสดงว่าอันไหนใช้ไม่ได้แล้ว); หน้าปัจจุบันมี `aria-current="page"`; มือถือมีปุ่มเมนู `aria-expanded` + `aria-controls`
- `ProjectCard`: ภาพ `thumbnail_url` (alt "ภาพโครงการ <ชื่อ>", `loading="lazy"`; ไม่มีภาพ = กล่องสี slate พร้อมข้อความ), ชื่อ, `ย่าน · จังหวัด`, "เริ่มต้น X ล้านบาท" (`formatMillion`), "N ชั้น · M ห้อง", ป้าย "แนะนำ" เมื่อ `is_featured`, ลิงก์ "ดูรายละเอียด" → `/project/:id` (ลิงก์เดียวต่อการ์ด ไม่ซ้อน anchor)
- หน้า `/reservations`: โหลด `getUnit` ของแต่ละ id (`Promise.allSettled`); แสดงเลขห้อง โครงการ ราคา สถานะ; ปุ่ม "ยกเลิกการจอง (Demo)"; id ที่ห้องไม่ available แล้วหรือไม่พบ → แสดง "รายการนี้ใช้ไม่ได้แล้ว" พร้อมปุ่มลบ; ว่าง → "ยังไม่มีรายการที่จอง" + ลิงก์ไปค้นหา; ข้อความ "การจองนี้เป็นการสาธิต เก็บไว้ในเบราว์เซอร์นี้เท่านั้น"

- [ ] **Step 1: Write the failing tests:** `useResource` (สำเร็จ → report source; NotFoundError → missing; retry เรียกใหม่; เปลี่ยน deps แล้วคำตอบเก่าถูกทิ้ง); `ProjectCard` (href, ราคา, src ของภาพต่อท้าย BASE_URL, ป้ายแนะนำ, ไม่มีภาพ); `AmenityIcon` (ทุกชื่อใน `generate().amenities` มี mapping จริง ไม่ตกไปไอคอน default); `Navbar` (ตัวเลขการจองอัปเดตเมื่อเรียก `saveReservations`, เมนูมือถือ toggle, `aria-current`); หน้ารายการจอง (ว่าง, มีรายการ, ยกเลิก, id เก่าที่ห้องขายแล้ว); `stale.test.tsx` เดิมต้องผ่านหลัง refactor
- [ ] **Step 2:** `npm test -w web` → FAIL
- [ ] **Step 3:** เขียนตาม Interfaces; refactor `ExplorerPage`/`UnitPage` ให้ใช้ `useResource` (พฤติกรรมเดิม); ยังคง `TempHome` ไว้จน Task 5
- [ ] **Step 4:** `npm test -w web` → PASS; `npx tsc -p apps/web` ผ่าน
- [ ] **Step 5:** Commit `feat(web): navbar, shared resource hook, project card and reservations page`

---

### Task 5: หน้าแรก (หน้าค้นหา)

**Files:**
- Create: `apps/web/src/features/home/{HomePage,Hero}.tsx`, `HomePage.test.tsx`
- Modify: `apps/web/src/App.tsx` (index → `HomePage`), ลบ `components/TempHome.tsx`

ลำดับบนลงล่างตามสเปกข้อ 8.1: Navbar (จาก Layout) → **Hero** (ภาพนิ่งของโครงการแนะนำจาก `thumbnail_url`, หัวเรื่อง, **ฟอร์มค้นหาเด่นที่สุด**: ชื่อโครงการ/ทำเล, จังหวัด, เขต (ตัวเลือกมาจากโครงการที่โหลดมา เขตกรองตามจังหวัด), ราคาต่ำสุด/สูงสุด (ตัวเลือก 2/3/4/5/7/10/15 ล้าน), จำนวนห้องนอน) → ชิปทำเล (ย่านของโครงการที่มี → `/search?q=<ย่าน>`) → โครงการแนะนำ (การ์ด) → โครงการทั้งหมด (การ์ด, `searchProjects({ limit: 50 })`) → แถบ "สำรวจบนแผนที่" → Footer · กดค้นหา → `navigate('/search?' + new URLSearchParams(toQueryRecord(sanitizeSearchParams(ฟอร์ม))))`; ฟอร์มว่าง → `/search`

- [ ] **Step 1: Write the failing tests:** ส่วนต่างๆ ปรากฏตามลำดับหัวข้อ; กรอก "อารีย์" แล้วกดค้นหา → URL `/search?q=%E0%B8%AD%E0%B8%B2%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B9%8C`; เลือกจังหวัด/ราคา/ห้องนอน → query ถูกต้อง; ฟอร์มว่าง → `/search`; อักขระพิเศษ `%`, `'`, `\` ใน q ไม่ทำให้พัง (URL encode ถูก); คลิกชิป "อ่อนนุช" ไปค้นหาย่านนั้น; โหลดไม่สำเร็จ → `LoadError` มีปุ่มลองใหม่; ไม่มีแผนที่/ตึก 3D/`canvas` ในหน้า; `/` ไม่เรียก three (ตรวจจริงใน Task 10)
- [ ] **Step 2:** `npm test -w web` → FAIL
- [ ] **Step 3:** เขียน `Hero`, `HomePage`; เปลี่ยน route; ลบ `TempHome` (ปลายทาง `/search`, `/project/:id`, `/map` ยังเป็นหน้า "ไม่พบ" จนถึง Task 6–8 — ปกติของ branch นี้)
- [ ] **Step 4:** `npm test -w web` → PASS
- [ ] **Step 5:** Commit `feat(web): search-first home page`

---

### Task 6: หน้าผลการค้นหา `/search`

**Files:**
- Create: `apps/web/src/features/search/{SearchPage,FiltersPanel}.tsx`, `SearchPage.test.tsx`
- Modify: `apps/web/src/App.tsx`

**Interfaces — Produces:** `FiltersPanel(props: { value: ProjectSearchParams; onChange(p: ProjectSearchParams): void })` (Task 8 ใช้ซ้ำในหน้าแผนที่)
- URL คือแหล่งความจริง: อ่านด้วย `useSearchParams` → `sanitizeSearchParams` → `searchProjects`; แก้ตัวกรองแล้วเขียนกลับ URL (`replace`) ด้วย `toQueryRecord`
- ตัวกรอง: ข้อความ, จังหวัด, เขต, ราคา (ต่ำสุด/สูงสุด), ห้องนอน, เรียงลำดับ (`แนะนำ`, `ราคาต่ำ→สูง`, `ราคาสูง→ต่ำ`, `ใหม่สุด`); เดสก์ท็อปเป็นแถบด้านข้าง, มือถือเป็นแผนที่เปิด/ปิดด้วยปุ่ม "ตัวกรอง (n)" (`aria-expanded`)
- ผลลัพธ์: "พบ N โครงการ", การ์ดโครงการ, ปุ่ม "ดูบนแผนที่" → `/map?` + ตัวกรองเดิม **ไม่รวม** `sort/limit/offset`, ปุ่ม "ล้างตัวกรอง"; ว่าง → "ไม่พบโครงการที่ตรงเงื่อนไข" + ล้างตัวกรอง; ข้อผิดพลาด → `LoadError` (ไม่ใช่หน้า NotFound)
- `// shortcut: ไม่มีปุ่มเลื่อนหน้า (มี 5 โครงการ ค่า limit เริ่มต้น 20), ทำเมื่อโครงการเกิน 20`

- [ ] **Step 1: Write the failing tests:** URL ขยะตาม Review Focus ข้อ 1 (`?minPrice=abc&maxPrice=1&minPrice=5&limit=999&bedrooms=9&sort=x&q=` + 500 ตัว) → เห็นผลลัพธ์ ไม่มี error; เปลี่ยนตัวกรอง → URL เปลี่ยน; ผลว่าง → ข้อความและปุ่มล้าง; ปุ่ม "ดูบนแผนที่" มี href ตามกติกา; เรียงลำดับเปลี่ยนลำดับการ์ดตรงกับ `searchProjectsLocal`; ตัวกรองบนมือถือเปิด/ปิด; `q` ว่างจากหน้าแรก = ทุกโครงการ; API ตอบ error → `LoadError`
- [ ] **Step 2:** รัน → FAIL
- [ ] **Step 3:** เขียนหน้าและแผงตัวกรอง; เพิ่ม route
- [ ] **Step 4:** `npm test -w web` → PASS
- [ ] **Step 5:** Commit `feat(web): search results page with URL-driven filters`

---

### Task 7: หน้ารายละเอียดโครงการ `/project/:projectId`

**Files:**
- Create: `apps/web/src/features/project/{ProjectPage,Gallery,Availability}.tsx`, `ProjectPage.test.tsx`
- Modify: `apps/web/src/App.tsx`

องค์ประกอบ (สเปกข้อ 10 หน้า 3 + 8.1): แกลเลอรี (ภาพโครงการ + ภาพห้องนั่งเล่นของแต่ละประเภทที่มี `images/interiors/<imageFile(type,'living')>.webp`; ภาพห้องมี `AiBadge`; ภาพรอง = ปุ่มสลับภาพใหญ่ใช้คีย์บอร์ดได้) · ชื่อ ที่ตั้ง (`address_display`) ราคาเริ่มต้น · สิ่งอำนวยความสะดวก (`AmenityIcon` + ชื่อ) · ข้อมูลอาคาร (ชื่อ ช่วงชั้นพักอาศัย) · คำอธิบาย · **ห้องว่างแยกตามประเภท** (ตาราง: ประเภท, จำนวนห้องว่าง, ราคาเริ่มต้น; ประเภทที่ไม่มีห้องว่างแสดง "ไม่มีห้องว่าง") · ปุ่มเด่น **"เลือกห้องจากตัวอาคาร"** → `/explorer/:id` (ถ้าไม่มีตึกที่ `has_explorer` ให้แสดงข้อความแทนปุ่ม)

- [ ] **Step 1: Write the failing tests:** แสดงทุกส่วนของโครงการ 1 ตรงกับ `buildProjectDetail`; ปุ่มไป explorer มี href ถูก; `/project/999999` → "ไม่พบข้อมูล"; ประเภทที่ available = 0 แสดง "ไม่มีห้องว่าง" และปุ่มยังใช้ได้ (สร้างข้อมูลทดสอบโดยแก้สถานะห้องของประเภทหนึ่งเป็น sold); ภาพห้องมี `AiBadge` ส่วนภาพโครงการไม่มี; เลื่อนภาพด้วยคีย์บอร์ด; โหลดไม่สำเร็จ → `LoadError`
- [ ] **Step 2:** รัน → FAIL
- [ ] **Step 3:** เขียนหน้า, `Gallery`, `Availability`; เพิ่ม route
- [ ] **Step 4:** `npm test -w web` → PASS
- [ ] **Step 5:** Commit `feat(web): project detail page`

---

### Task 8: แผนที่ `/map` (MapLibre + OpenFreeMap)

**Files:**
- Create: `apps/web/src/features/map/{geo.ts,MapView.tsx,MapPage.tsx}`, `geo.test.ts`, `MapPage.test.tsx`
- Modify: `apps/web/src/App.tsx`, `apps/web/package.json` (`npm i -w web maplibre-gl`)

**Interfaces — Produces:**
```ts
// geo.ts (บริสุทธิ์ ไม่แตะ maplibre)
export const THAILAND_VIEW: { center: [number, number]; zoom: number };
export function boundsOf(projects: Pick<Project, 'latitude' | 'longitude'>[]): [[number, number], [number, number]] | null;   // [[west,south],[east,north]] เผื่อขอบ; โครงการเดียว → กรอบเล็กรอบจุดนั้น; ว่าง → null
// MapView.tsx (โหลดแบบ lazy เท่านั้น)
export default function MapView(props: { projects: Project[]; onUnavailable(reason: 'style' | 'webgl'): void }): JSX.Element;
```
- **ก่อนใช้ ตรวจชนิดข้อมูลใน `node_modules/maplibre-gl`**: ชื่อ option ของ `Marker` ที่รับ element, ชื่อ event `error`, วิธีรู้ว่าไม่มี WebGL (ผล: จดใน commit message)
- ตั้งค่าตามเอกสาร OpenFreeMap: `setWorkerUrl(workerUrl)` ด้วย `?worker&url`, import CSS, style `https://tiles.openfreemap.org/styles/liberty`; หมุดเป็น `<button type="button" aria-label="โครงการ <ชื่อ>">` (ใช้คีย์บอร์ดได้); popup สร้างด้วย DOM + `textContent` (ห้าม `setHTML` กับข้อมูลที่มาจาก API): ชื่อ ที่ตั้ง "เริ่มต้น X ล้านบาท" ลิงก์ "ดูโครงการ" → `#/project/<id>`; `fitBounds(boundsOf(...))`; `map.remove()` ตอน unmount (รองรับ StrictMode); ผิดพลาดของ style/tile หรือสร้าง `Map` ไม่ได้ → `onUnavailable`
- `MapPage`: ตัวกรองเดียวกับหน้าค้นหา (`FiltersPanel` + `sanitizeSearchParams`), เดสก์ท็อป: รายการโครงการด้านซ้าย แผนที่ขวา; มือถือ: ปุ่มสลับ "แผนที่ / รายการ" (`aria-pressed`); `MapView` ผ่าน `React.lazy` + `Suspense`; เมื่อ `onUnavailable` → แสดง `role="status"` "แผนที่โหลดไม่ได้ กำลังแสดงเป็นรายการแทน" และบังคับมุมมองรายการ; **เครดิตของเราเสมอใต้แผนที่**: "แผนที่: OpenFreeMap © OpenMapTiles ข้อมูลจาก OpenStreetMap" (ลิงก์ไป openfreemap.org, openmaptiles.org, openstreetmap.org/copyright)

- [ ] **Step 1: Write the failing tests:** `geo.test.ts` (หลายโครงการ → กรอบครอบทุกจุดและเผื่อขอบ; โครงการเดียว → กรอบไม่เป็นศูนย์; ว่าง → null; ตัวกรองจริง: โครงการที่อยู่นอกประเทศไทยไม่มีในข้อมูล) · `MapPage.test.tsx` (ใช้ `vi.mock('./MapView')` เฉพาะตัวแผนที่ที่ต้องมี WebGL: รายการโครงการแสดงครบ 5; ตัวกรองจาก URL ลดรายการ; ปุ่มสลับแผนที่/รายการ; เมื่อ mock เรียก `onUnavailable` เห็นข้อความแจ้งและรายการ; มีบรรทัดเครดิตและลิงก์ครบ; โหลดไม่สำเร็จ → `LoadError`)
- [ ] **Step 2:** รัน → FAIL
- [ ] **Step 3:** ติดตั้ง maplibre-gl, ตรวจชนิดข้อมูลตามข้างบน, เขียนไฟล์ทั้งสาม, เพิ่ม route
- [ ] **Step 4:** `npm test -w web` → PASS; `npm run build -w web` ผ่าน และ `maplibre` อยู่ใน chunk แยก (ตรวจละเอียดใน Task 10)
- [ ] **Step 5:** Commit `feat(web): map explorer with OpenFreeMap and list fallback`

---

### Task 9: e2e ทั้งทางเดิน + มือถือ + การเข้าถึง

**Files:**
- Create: `apps/web/e2e/journeys.spec.ts`
- Modify: `apps/web/package.json` (`npm i -D -w web @axe-core/playwright`)

เทสต์ (รันกับ API จริงในเครื่องผ่าน `npm run e2e` เดิม):
- **ทางเดินหลัก:** `/` → พิมพ์ "อารีย์" → ค้นหา → การ์ด Noventa Ari → "เลือกห้องจากตัวอาคาร" → คลิกห้องบนตึก 3D → "ดูรายละเอียดห้อง" → เห็นเลขห้องเดียวกัน
- **URL ขยะ:** `#/search?minPrice=abc&limit=999&bedrooms=9&q=<500 ตัว>` → เห็นการ์ดโครงการ ไม่มีข้อความ error
- **แผนที่:** ส่ง style ขั้นต่ำผ่าน `page.route('https://tiles.openfreemap.org/**', …)` (JSON `version 8` มี layer `background`) → หมุด 5 ตัว, กด Enter ที่หมุดหนึ่งเปิด popup, คลิก "ดูโครงการ" ไปหน้าโครงการนั้น; และอีกเทสต์ `route.abort()` ทั้งโดเมน → ข้อความ "แผนที่โหลดไม่ได้" และเห็นรายการ; เครดิต OpenStreetMap เห็นเสมอ
- **มือถือ (390×844):** เมนู Navbar เปิด/ปิด, ตัวกรองหน้าค้นหาเปิด/ปิด, สลับแผนที่/รายการ, ไม่มีแถบเลื่อนแนวนอน (`scrollWidth ≤ innerWidth`)
- **การเข้าถึง:** `@axe-core/playwright` กับ `#/`, `#/search`, `#/project/1`, `#/unit/1`, `#/map` (ยกเว้น canvas ของแผนที่) ต้องไม่มี violation ระดับ `serious` หรือ `critical` — ถ้าเจอให้แก้ที่ต้นเหตุ (contrast, label) ไม่ใช่ปิดกฎ
- **ไม่มีป้ายผิดที่:** ทุกหน้ามีข้อความ "ข้อมูลจำลองเพื่อการสาธิต ไม่มีการขายจริง"

- [ ] **Step 1:** เขียนเทสต์ทั้งหมด; `npm run e2e` → ข้อที่ยังผิดต้องล้มด้วยเหตุผลที่ถูก (เช่น axe เจอ contrast)
- [ ] **Step 2:** แก้โค้ดของหน้าต่างๆ ตามที่ล้มจนผ่าน (บันทึกเป็น `Ruling:` ทุกครั้งที่แก้นอก Task นี้)
- [ ] **Step 3:** `npm run e2e` → PASS ทั้งหมด (เดิม 16 + ใหม่); `npm test` ผ่าน
- [ ] **Step 4:** Commit `test(e2e): full journey, mobile and accessibility checks`

---

### Task 10: ตรวจขนาด bundle และแยก chunk

**Files:**
- Create: `apps/web/scripts/check-bundles.mjs`, `apps/web/scripts/check-bundles.test.ts` (ทดสอบฟังก์ชันตัดสิน `evaluateBundles` ที่ไม่แตะดิสก์)
- Modify: `apps/web/package.json` (`"check:bundles": "node scripts/check-bundles.mjs"`)

**Interfaces — Produces:** `evaluateBundles(chunks: { name: string; code: string; gzipBytes: number; entry: boolean }[]): string[]` (รายการปัญหา; ว่าง = ผ่าน)
กติกา: chunk ที่ถูกโหลดตอนเปิดหน้าแรก (entry และที่มัน import แบบ static) **ต้องไม่มี** `WebGLRenderer` หรือ `maplibre`; entry ≤ 130 KB gzip (ตอนนี้ ~93 KB); chunk ของ 3D ≤ 600 KB gzip (ตอนนี้ ~302 KB, เกณฑ์ของแผน 1); chunk ของแผนที่ = ขนาดจริงที่วัดได้ตอน Task 8 + 10% (ยังไม่เคยวัด จึงไม่เดาตัวเลขล่วงหน้า — จดค่าลง commit message ของ Task 8 แล้วตั้งเป็นค่าคงที่ในสคริปต์); `fallback-*.js` ต้องเป็น chunk แยก

- [ ] **Step 1: Write the failing test:** `evaluateBundles` — entry ที่มี `WebGLRenderer` → รายงานปัญหา; entry เกินงบ → ปัญหา; ชุดปกติ → `[]`
- [ ] **Step 2:** รัน → FAIL
- [ ] **Step 3:** เขียนฟังก์ชันและสคริปต์ (อ่าน `dist/assets`, หา entry จาก `dist/index.html`, ไล่ import แบบ static); รัน `npm run build -w web && npm run check:bundles -w web` ต้องผ่าน — ถ้าไม่ผ่านให้แก้ที่โค้ด (lazy import) ไม่ใช่ปรับงบของ entry และ 3D
- [ ] **Step 4:** Commit `test(web): guard bundle split and size budgets`

---

### Task 11: CI และ Deploy (มีขั้นที่ผู้ใช้ต้องทำเอง)

**Files:**
- Create: `.github/workflows/{ci.yml,deploy-api.yml,deploy-web.yml,seed-db.yml}`, `scripts/smoke-live.mjs`, `packages/shared/test/repo.test.ts`
- Modify: root `package.json` (`typecheck`), `apps/api/wrangler.jsonc` (`database_id` จริงในขั้น 🧑), `packages/shared/package.json` (`npm i -D -w @condoscope/shared yaml`)

**Workflows (สิทธิ์น้อยที่สุดต่อไฟล์):**
- `ci.yml`: เมื่อ pull_request และ push → `checkout@v7`, `setup-node@v7` (node 24, cache npm), `npm ci`, `npm run typecheck`, `npm test`, `npm run build -w web`, `npm run check:bundles -w web`; งาน `e2e` แยก (ติดตั้ง Chromium ด้วย `npx playwright install --with-deps chromium`) รันเฉพาะ push เข้า `main` และ `workflow_dispatch`; `permissions: contents: read`
- `deploy-api.yml`: push เข้า `main` ที่แตะ `apps/api/**`, `database/**`, `packages/shared/**` + `workflow_dispatch` → `cloudflare/wrangler-action@v4` (`workingDirectory: apps/api`): `d1 migrations apply condoscope --remote` แล้ว `deploy`; ใช้ `secrets.CLOUDFLARE_API_TOKEN` / `secrets.CLOUDFLARE_ACCOUNT_ID`
- `deploy-web.yml`: push เข้า `main` + dispatch → build (`VITE_API_URL: ${{ vars.VITE_API_URL }}`) → `configure-pages@v5` → `upload-pages-artifact@v4` (path `apps/web/dist`) → job `deploy` ด้วย `deploy-pages@v4`, `environment: github-pages`, `permissions: pages: write, id-token: write`, `concurrency: pages`
- `seed-db.yml`: `workflow_dispatch` เท่านั้น มี input `confirm` ต้องพิมพ์ `SEED` ถึงรัน (`d1 execute condoscope --remote --file ../../database/seeds/seed.sql`) พร้อมคำเตือนในชื่อ job เรื่องโควตาเขียน
- `scripts/smoke-live.mjs <apiUrl>`: GET `/api/health`, `/api/projects`, `/api/projects/1/explorer` ด้วย `Origin: https://rawinan-txt.github.io` แล้วพิมพ์ status, ขนาด, เวลา, `cache-control`, `cf-cache-status`, `access-control-allow-origin`; ออกด้วยรหัสไม่ใช่ศูนย์ถ้าไม่ใช่ 200 หรือไม่มี ACAO ของ origin นั้น

- [ ] **Step 1: Write the failing test** `repo.test.ts` (อ่านทุกไฟล์ใน `.github/workflows` ด้วย `yaml`): แต่ละไฟล์ parse ได้และมี `permissions` ระดับ workflow หรือ job; ไม่มีสตริงที่หน้าตาเป็น token/secret (regex รูปแบบ token ยาว) ฝังอยู่; ค่า Cloudflare ทุกตัวมาจาก `secrets.`/`vars.`; `deploy-web.yml` มี `pages: write` และ `id-token: write`; `seed-db.yml` เริ่มด้วย `workflow_dispatch` อย่างเดียวและมี input `confirm`; Actions ทุกตัวเป็น major ตามรายการข้างบน
- [ ] **Step 2:** `npm test -w @condoscope/shared` → FAIL
- [ ] **Step 3:** เขียน workflows, `typecheck` (รวม `tsc` ของ shared, api, api/test, web), `smoke-live.mjs`; ลอง `smoke-live.mjs http://localhost:8788` กับ `npm run api:dev` ในเครื่อง (ต้องผ่าน) และ `npm run typecheck`
- [ ] **Step 4:** `npm test` → PASS; Commit `ci: workflows for tests, API deploy, Pages deploy and manual seed`
- [ ] **Step 5: 🧑 หยุดและให้ผู้ใช้ทำตาม "สิ่งที่ผู้ใช้ต้องทำเอง" ข้อ 1–6** (ผู้ปฏิบัติห้ามขอ token ในแชท และห้าม push/merge เอง): เมื่อผู้ใช้ส่ง `database_id` มา ให้ใส่ใน `wrangler.jsonc` (พร้อมคอมเมนต์ว่าไม่ใช่ความลับ) แล้ว commit
- [ ] **Step 6: 🧑 หลังผู้ใช้ merge และ deploy ครั้งแรก:** รัน workflow `seed-db` หนึ่งครั้ง (ผู้ใช้กดเอง), รัน `node scripts/smoke-live.mjs <URL ของ API>` แล้วจดผลวัดจริง (เวลาตอบของ explorer, `cf-cache-status`) ลง `docs/architecture.md` ส่วนโควตา; ตรวจในแดชบอร์ด Cloudflare ว่า CPU ต่อ request ของ explorer ไม่ถึงเพดาน 10 ms และจำนวนแถวที่อ่าน; ถ้าเกิน ให้เปิดเป็นงานใหม่ (ไม่แก้เงียบๆ)

---

### Task 12: README, ภาพหน้าจอ และเอกสาร

**Files:**
- Create: `apps/web/scripts/screenshots.mjs`, `docs/screenshots/{home,search,project,map,explorer,unit}.png`
- Modify: `README.md`, `docs/architecture.md`, `CLAUDE.md`, root `package.json` (`screenshots`)

`screenshots.mjs`: build เว็บแบบไม่ตั้ง `VITE_API_URL` (ใช้ข้อมูลสำรอง ไม่ต้องมีเซิร์ฟเวอร์ API) + preview → Playwright ถ่ายทั้ง 6 หน้า (viewport 1400×900; หน้าแผนที่ใช้ style ขั้นต่ำผ่าน `page.route` เหมือน e2e เพื่อไม่ขึ้นกับอินเทอร์เน็ต)

README ตามสเปกเดิมข้อ 19: ภาพรวม · ฟีเจอร์ · Tech stack (ตามจริง: Tailwind ไม่มี shadcn/ui) · สถาปัตยกรรม (ลิงก์ `docs/architecture.md`) · การออกแบบฐานข้อมูล (ลิงก์) · การติดตั้ง · รันในเครื่อง · Deploy (รายการที่ต้องตั้ง: secrets, variable, Pages) · ภาพหน้าจอ · ข้อความข้อมูลจำลอง · ลิงก์เดโม (เติมหลัง deploy; ก่อนหน้านั้นเขียนว่า "ยังไม่ deploy") · หัวข้อ **"บทบาทของฉันและการใช้ AI" เว้นว่างพร้อมคอมเมนต์ HTML ให้ผู้ใช้เขียนเอง**

- [ ] **Step 1:** เขียนสคริปต์ภาพหน้าจอ รัน `npm run screenshots` ได้ 6 ไฟล์ และ **เปิดดูทุกภาพด้วยตา** ว่าเนื้อหาถูกหน้าและไม่ว่างเปล่า
- [ ] **Step 2:** เขียน README และเติม `docs/architecture.md` (ส่วนหน้าเว็บ: เส้นทาง, `useResource`, ตัวล้างพารามิเตอร์, แผนที่และเครดิต, deploy, ตารางงบ bundle)
- [ ] **Step 3:** ตรวจลิงก์ภายใน README ทุกลิงก์ชี้ไฟล์ที่มีจริง; รัน `npm test`, `npm run typecheck`, `npm run build -w web && npm run check:bundles -w web`, `npm run e2e` ต้องผ่านทั้งหมด จดจำนวนเทสต์
- [ ] **Step 4:** อัปเดต `CLAUDE.md` ส่วน "สถานะ": แผน 3 เสร็จ/ค้างที่ขั้น 🧑 ไหน, จำนวนเทสต์, รายการที่ผู้ใช้ต้องทำ; **เตือนผู้ใช้ตามกฎใน CLAUDE.md:** ถึงเวลาทำส่วน QA/BA (checklist 5 ข้อ) และถามว่าจะเริ่มงานเสริมประเภทห้องใหม่ (สเปกข้อ 14) กับงานรอบ UX/UI หรือไม่ — **ห้ามเริ่มเองจนกว่าผู้ใช้อนุญาต**
- [ ] **Step 5:** Commit `docs: README, screenshots and architecture for the web app and deploy`

---

## เมื่อจบแผน 3
- `npm test`, `npm run typecheck`, `npm run check:bundles -w web` และ `npm run e2e` ผ่านทั้งหมด; workflow ผ่านการตรวจโดย `repo.test.ts`
- ขั้นถัดไป: whole-branch review → ผู้ใช้ตัดสินใจ merge → ทำขั้น 🧑 (deploy, seed, วัดจริง) → ถามผู้ใช้เรื่อง QA/BA, ประเภทห้องใหม่ และงานรอบ UX/UI
