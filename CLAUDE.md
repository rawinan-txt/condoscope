# CondoScope — คู่มือสำหรับ Claude

เว็บค้นหาและเลือกซื้อคอนโด (ข้อมูลจำลอง) สำหรับ portfolio ของผู้ใช้ จุดเด่นคือ **Building Explorer 3D** ที่ให้เลือกห้องจากตัวตึกได้โดยตรง

## อ่านก่อนเริ่มงาน
1. `docs/specs/2026-11-09-condoscope-design.md` — **สเปกหลักปัจจุบัน** (ถ้าขัดกับสเปกเดิม ให้ยึดไฟล์นี้)
2. `docs/original-spec.md` — สเปกต้นฉบับของผู้ใช้
3. `prototype/building-3d/` — ต้นแบบตึก 3D ที่ผู้ใช้ทดลองแล้วชอบ (เปิด `index.html` ได้เลย ส่วน `main.js` คือซอร์ส) ใช้อ้างอิงหน้าตาเท่านั้น ห้ามนำไปใช้เป็นโค้ดจริงตรงๆ

## สถานะ
- ✅ ระดมไอเดียและทำต้นแบบ 3D เสร็จแล้ว (ทำในแชท claude.ai)
- ✅ ผู้ใช้อนุมัติ design spec แล้ว (2026-11-09 รวมข้อ 13)
- ✅ ภาพภายในห้อง: ภาพ AI 17 ภาพของผู้ใช้ แปลงเป็น WebP แล้วอยู่ที่ `apps/web/public/images/interiors/` (2br/2br_plus ใช้ภาพระเบียงจาก 1br, ห้องนอน 2 ใช้ภาพห้องนอนของประเภทเดียวกัน)
- ✅ **แผน 1 เสร็จ** (`docs/plans/2026-11-09-plan-1-data-explorer-unit.md`) บน branch `feat/plan-1` — อัปเดต 2026-11-09
  - ครบ 10 task: monorepo, ตัวสร้างข้อมูล 5 โครงการ (ทุกโครงการมีตึก 3D), หน้า Explorer (3D + SVG สำรอง + รายการห้อง + ผ่าชั้น + ตัวกรอง + จองจำลอง + พลบค่ำ/กลางวัน), หน้า Unit Detail (แปลน + hotspot + ภาพจริง)
  - ตรวจงานทั้ง branch แล้ว (ผล: merge ได้หลังแก้) และแก้ครบ: ErrorBoundary ให้ 3D พังแล้วสลับเป็น 2D, ไม่วาดฉากใหม่ทุกครั้งที่ขยับเมาส์, ลูกศรด้านหลังตึกถูกทิศ, HDRI ไม่บล็อกการแสดงตึก
  - Test: Vitest 26 + 33 ผ่าน, Playwright e2e 11 ผ่าน · chunk Building3D ~302 KB gzip (เกณฑ์ ≤ 600 KB)
  - SSAO ใช้แทน N8AO (N8AO พังกับ three 0.187) และใช้เงา PCF (three 0.187 ตัด PCFSoft)
  - เรื่องเล็กที่ยังไม่แก้ (ผู้ใช้ตัดสินใจ): `hasWebGL()` ไม่คืน WebGL context, `TempHome` ไม่มี error state, CanvasTexture ของ `City` ไม่ถูก dispose, hook ทดสอบ `window.__condoscope` อยู่ใน production, ยังไม่มี unit test สำหรับ `#/explorer/abc`
  - ✅ กล้อง 3D หมุนไปหาห้องที่เลือกจากรายการ/คีย์บอร์ดเมื่อห้องนั้นมองไม่เห็น (`unitViewGoal` ใน `scene/layout.ts`) — e2e 12 ผ่าน, Vitest 34 ผ่าน
- ✅ **แผน 1 merge เข้า `main` แล้ว** (ผู้ใช้ทำเอง)
- ✅ **แผน 2 (API Hono + D1) เสร็จและ merge เข้า `main` แล้ว (PR #1)** (`docs/plans/2026-11-09-plan-2-api-d1.md`) — ตรวจโดยผู้ตรวจอิสระและแก้ครบ
  - ผู้ตรวจเจอ 0 ร้ายแรง / 2 สำคัญ (แก้แล้ว: คำตอบเก่าของหน้าที่ออกมาแล้วไม่เขียนทับหน้าใหม่หรือแบนเนอร์, JSON ผิดรูปจาก API ไม่ถูกถือเป็นข้อมูลจริง) / 6 เล็ก (ยังไม่แก้ ผู้ใช้ตัดสินใจ): ค้นหาแล้ว API ตอบ 400 จะกลายเป็น "ไม่พบข้อมูล" ทั้งที่ fallback รับอินพุตเดียวกันได้ (ให้ตรวจ/จำกัดที่หน้าค้นหาในแผน 3), HEAD ไม่มี Cache-Control, 405 ไม่มี CORS header, test หนึ่งข้ออาจผ่านโดยไม่ได้ตรวจ, การเรียงลำดับเมื่อเสมอกันของ fallback ใช้ `localeCompare` ส่วน SQL ใช้ลำดับไบนารี, CPU ของ explorer ยังไม่ได้วัด
  - ทำแล้ว: API 10 endpoint อ่านอย่างเดียว (Hono + zod), schema D1 + seed จาก `packages/shared`, ชั้น SQL ที่ test เทียบผลกับ fallback ทุกเคส, CORS/แคช/ปิดเมธอดเขียน, เว็บเรียก API จริงก่อนแล้ว fallback พร้อมแบนเนอร์, e2e รัน API จริง + จำลอง API ล่ม
  - Test: Vitest shared 44 + api 209 + web 59 ผ่าน, Playwright e2e 16 ผ่าน · `docs/architecture.md` มี ER, ตาราง endpoint, กติกา error/CORS/แคช, โควตาฟรี
  - บั๊กจริงที่ test จับได้ระหว่างทำ: D1 จำกัด `LIKE` pattern ราว 50 ไบต์ → คำค้นไทยยาว 17 ตัวอักษรขึ้นไปตอบ 500 จึงใช้ `instr(lower(...))` แทน
  - รันในเครื่อง: `npm run db:reset` → `npm run api:dev` (พอร์ต 8788) → ตั้ง `VITE_API_URL=http://localhost:8788` ใน `apps/web/.env.local` · ทดสอบเบราว์เซอร์ `npm run e2e`
  - ⚠️ บน Windows โปรเซสที่ Playwright/`wrangler dev` เปิดอาจค้างหลังหยุดกลางคัน (ปิดแค่ตัวแม่แล้ว `workerd` ลูกยังรับพอร์ต) จึงตั้งพอร์ตเปลี่ยนได้ด้วย `E2E_PORT` / `E2E_API_PORT`
  - ⏳ **ก่อนแผน 3 ผู้ใช้ต้องเตรียม (สเปกข้อ 12):** บัญชี Cloudflare แบบฟรี (ไม่ต้องผูกบัตร) + API token สำหรับ GitHub Actions + เปิด GitHub Pages ของ repo
  - ⏳ **ต้องวัดตอน deploy จริง:** CPU ต่อ request ของ explorer (เพดาน 10 ms บน Workers ฟรี), `cf-cache-status` บน `*.workers.dev`, จำนวนแถวที่ D1 อ่านต่อวัน · **ห้าม seed ฐานข้อมูลจริงซ้ำหลายรอบ** (รอบแรกเขียนราว 12,000 แถว seed ซ้ำอาจราว 2 เท่า เพดานฟรี 100,000/วัน)
- ✅ **แผน 3 เขียนโค้ดครบ 12 task และผ่านผู้ตรวจอิสระแล้ว (รอผู้ใช้ push/merge → ขั้น 🧑 deploy)** (`docs/plans/2026-11-09-plan-3-frontend-deploy.md`) บน branch `feat/plan-3` — ผู้ใช้อนุมัติแล้ว 2026-11-09 (12 task; Task 11 มีขั้น 🧑 ที่ผู้ใช้ต้องทำเอง) · ความคืบหน้าจะอัปเดตด้านล่างทุก task
  - ✅ แผน 3 Task 1 แก้ช่องโหว่ของแผน 1 แล้ว: โฟลเดอร์ภาพเป็น `images/interiors/…` ตามสเปกข้อ 5 และเว็บมีป้าย "ภาพประกอบสร้างด้วย AI" (`components/AiBadge.tsx`)
  - ✅ Task 2–8: ตัวล้างพารามิเตอร์ค้นหา, ภาพโครงการ, Navbar/hook `useResource`/การ์ด/หน้ารายการจอง, หน้าแรกแบบค้นหา, หน้าผลค้นหา, หน้าโครงการ, แผนที่ (OpenFreeMap)
  - ✅ Task 9 เสร็จ: e2e 30 ข้อผ่านครบ (เดิม 16 + ใหม่ 14: ทางเดินหลัก, URL ขยะ, แผนที่ 2, มือถือ 2, ป้ายข้อมูลจำลองทุกหน้า, axe 6 หน้า, path ภาพใต้ /condoscope/) — รอบแรกล้มหมดเพราะติดตั้ง `@axe-core/playwright` แล้ว Playwright อัปเดตรุ่น ต้อง `npx playwright install chromium` ใหม่ ไม่ใช่บั๊กของเว็บ · ถ้าใช้ `--reporter=line` จะไม่เห็นข้อที่ผ่าน ให้ใช้ `--reporter=list`
  - ✅ Task 10 bundle guard (`npm run check:bundles -w web`: หน้าแรก ≤130 KB, 3D ≤600, แผนที่ ≤323 KB gzip; วัดจริง ≈99 / 292 / 284) · Task 11 workflow 4 ไฟล์ (`ci`, `deploy-api`, `deploy-web`, `seed-db`) + `scripts/smoke-live.mjs` + `packages/shared/test/repo.test.ts` + `npm run typecheck` · Task 12 README, `docs/architecture.md` (ส่วนหน้าเว็บ/deploy), ภาพหน้าจอ 6 ภาพ (`npm run screenshots` ใช้ API ในเครื่องเหมือน e2e ภาพจึงไม่มีแบนเนอร์ fallback)
  - Test ล่าสุด: Vitest shared 84 + api 210 + web 135 ผ่าน, `tsc` ผ่าน, e2e 29 ผ่าน + 1 ข้าม (spec ภาพหน้าจอรันเฉพาะ `npm run screenshots`) · ledger: `.superpowers/sdd/2026-11-09-plan-3-frontend-deploy/progress.md` · branch `feat/plan-3` ยังไม่ได้ push
  - ⚠️ เจอระหว่างทำ: matcher ของ jest-dom ผ่าน `@testing-library/jest-dom/vitest` หยุดทำงาน (ไปขยาย vitest อีกชุด) แก้โดย `expect.extend` ใน `src/test/setup.ts` · `npm i -w` พังด้วย bug ของ npm 11 จึงลง `yaml` ที่ root
  - ✅ **ผู้ตรวจอิสระ (opus) ดูทั้ง branch แล้ว:** 0 ร้ายแรง / 2 สำคัญ (แก้แล้ว: `.gitignore` ไม่กัน `.env`/`.env.local`/`*.local` ซึ่งอาจเผลอ commit token → เพิ่มกฎและมี test, seed-db ไม่มี concurrency lock → ใช้กลุ่ม `d1-remote` ร่วมกับ deploy-api พร้อม test, และแก้ข้อความว่า seed ซ้ำอาจเขียน ~2 เท่า) / 7 เล็ก (ยังไม่แก้ ผู้ใช้ตัดสินใจ):
    - `seed-db.yml` เช็ก `SEED` แบบไม่สนตัวพิมพ์ (พิมพ์ `seed` ก็รัน) และถ้าพิมพ์ผิด job แค่ "ข้าม" ดูเหมือนเขียว ควรเปลี่ยนเป็นขั้นที่ล้มชัดเจน
    - `deploy-api.yml` / `deploy-web.yml` deploy โดยไม่รัน test ก่อน (ไม่มี `needs`/`workflow_run` ของ CI)
    - action ผูกกับ major tag ไม่ใช่ commit SHA โดยเฉพาะ `cloudflare/wrangler-action@v4` ที่ได้รับ token (ถ้าจะ pin ต้องแก้ `repo.test.ts` ให้รับ SHA + คอมเมนต์) และเพิ่ม `persist-credentials: false` ใน checkout ของ deploy/seed · ยังไม่ได้ยืนยันว่า wrangler-action v4 ใช้ input `apiToken`/`accountId`/`workingDirectory`/`command` ตามนี้ → ดูตอน deploy ครั้งแรก
    - แก้ `seed.sql` แล้ว deploy-api ไม่ seed ใหม่ให้ (ฐานข้อมูลจริงอาจไม่ตรง `fallback.json`) ควรมี smoke check เทียบ `thumbnail_url` หรือจำไว้ว่าต้อง seed เอง
    - `ReservationsPage` เรียก `getUnit` ต่อ 1 id โดยไม่จำกัดจำนวน (ids มาจาก localStorage ของผู้ใช้เอง) ควร `slice(0, 50)`
    - `sanitizeSearchParams` ตัด `.slice(0, 100)` อาจผ่ากลาง emoji (ไม่ crash, ยังไม่มี test กรณีความยาวคี่)
    - README ขั้น deploy: ต้องรัน `Deploy web` ด้วยมือหลังตั้ง `VITE_API_URL` (เขียนเพิ่มแล้ว) — เหลือแค่ตรวจว่าผู้ใช้ทำตามจริง
  - ⏳ **ขั้นถัดไป:** ผู้ใช้ push/merge → ทำขั้น 🧑 deploy
  - 🧑 **สิ่งที่ผู้ใช้ต้องทำเอง (ห้ามส่ง token ในแชท):** (1) สมัคร Cloudflare ฟรี + สร้าง API token (Workers + D1) (2) ตั้ง GitHub secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (3) `wrangler d1 create condoscope` แล้วส่ง `database_id` มาใส่ `apps/api/wrangler.jsonc` (4) หลัง deploy API ตั้ง variable `VITE_API_URL` เป็นที่อยู่ `*.workers.dev` (5) เปิด GitHub Pages source = GitHub Actions (6) ยืนยันเงื่อนไข OpenFreeMap (อายุ ≥18, ไม่มี SLA) (7) หลัง merge กด workflow `seed-db` **ครั้งเดียว** (พิมพ์ `SEED`) แล้วให้ Claude รัน `smoke-live.mjs` + จดผลวัดจริงลง `docs/architecture.md` (Task 11 ขั้น 5–6 ยังค้าง)
  - ⚠️ บน Windows Playwright ค้างประมาณ 5 นาทีตอนปิดเซิร์ฟเวอร์หลังรัน test เสร็จ (ผล test ไม่กระทบ) · e2e ใช้พอร์ต 4321
  - บันทึกการตัดสินใจระหว่างพัฒนาอยู่ใน `.superpowers/sdd/2026-11-09-plan-1-data-explorer-unit/progress.md` (ไม่อยู่ใน git)
- 💤 **งานเสริมหลังแผน 3 (ยังไม่เริ่ม ห้ามเริ่มเองจนกว่าผู้ใช้อนุญาต):** เพิ่มประเภทห้องใหม่ 3 แบบตามลำดับ penthouse (ห้องใหญ่ชั้นบนสุด) → duplex (ห้อง 2 ชั้น แปลนแยกสองชั้น) → full-floor (ห้องเดียวทั้งชั้น) ต้องแก้โมเดลข้อมูล, ตัวสร้างตึก 3D, หน้ารายละเอียดห้อง, รูปภายใน (ผู้ใช้เจนเองด้วย Gemini) และ test case ใน `docs/qa-ba/` — รายละเอียดในสเปกข้อ 14
- 💤 **งานรอบ UX/UI หลังแผน 3 (ยังไม่เริ่ม ห้ามเริ่มเองจนกว่าผู้ใช้อนุญาต)** — ผู้ใช้สั่งเพิ่ม 2026-11-09
  - หน้า Explorer: ตึก 3D เต็มหน้าจอ แผงรายการห้อง/ตัวกรอง/รายละเอียดห้องลอยทับด้านข้างแบบโปร่งแสง (ต้องคงใช้คีย์บอร์ดและ screen reader ได้ และบนมือถือยังเป็น bottom sheet)
  - แผนที่กรุงเทพฯ (MapLibre + OpenFreeMap) ปักหมุดทั้ง 5 โครงการตามพิกัดในข้อมูลจำลอง กดหมุดแล้วเข้า Explorer ของโครงการนั้น — ⚠️ ขัดกับสเปกข้อ 8.1 ที่ให้ 3D เข้าผ่านหน้าโครงการ: ถามผู้ใช้ก่อนทำว่าจะให้หมุดไป Explorer ตรงๆ หรือไปหน้าโครงการ (หรือ popup มีปุ่มทั้งสอง)
  - หน้าแรกยังเป็นหน้าค้นหาก่อน แผนที่เป็นมุมมองสลับ (ตามกฎเดิม)
  - ตรวจ terms ของ OpenFreeMap ก่อนทำแผนที่ (ตรงกับสเปกข้อ 13.12)
  - หมายเหตุ: แผน 3 มีหน้า Map (หมุด 5 โครงการ + popup) อยู่แล้ว งานรอบนี้คือปรับต่อจากของแผน 3

## กฎที่ห้ามฝ่า
- **งบ 0 บาท:** ใช้ free tier และ open source เท่านั้น ห้ามใช้บริการที่ต้องผูกบัตร
- **ห้ามใช้ชื่อ ภาพ หรือแปลนของโครงการคอนโดจริง** และต้องมีป้าย "ข้อมูลจำลอง" ทุกหน้า
- ห้ามแสดงข้อมูล fallback ว่าเป็นข้อมูล live
- ห้ามมี secret ใน frontend และทุก SQL ต้องใช้ parameter binding
- UI เป็นภาษาไทย สกุลเงิน THB
- **หน้าแรกต้องเป็นหน้าค้นหาคอนโด** (Hero + ช่องค้นหา + การ์ดโครงการ) ห้ามเปิดมาเจอแผนที่ หน้าโครงการ หรือตึก 3D ทันที แผนที่เป็นทางเลือกรอง ส่วน 3D เข้าผ่านหน้าโครงการ (ดูสเปกข้อ 8.1)
- **ตอนแก้สเปกหรือไฟล์นี้ ให้อ่านเวอร์ชันล่าสุดจากดิสก์ก่อนทุกครั้ง** ผู้ใช้อาจแก้ไฟล์จากแชท claude.ai ไว้ (เคยเกิดกรณีเขียนทับจนข้อ 8.1 หายไปมาแล้ว)

## เอกสาร QA/BA ของผู้ใช้ (`docs/qa-ba/`)
ผู้ใช้จะยื่นฝึกงานสาย **QA / BA** เอกสารในโฟลเดอร์นี้เป็นผลงานของผู้ใช้
- **ห้ามเติมช่อง "ผลจริง" "สถานะ" หรือบั๊กแทนผู้ใช้** ผู้ใช้ต้องทดสอบและกรอกเอง
- ถ้าสเปกเปลี่ยน ให้แจ้งผู้ใช้ว่า test case ข้อไหนอาจต้องอัปเดต แทนการแก้เอง ยกเว้นผู้ใช้สั่ง

## ⏰ เมื่อพัฒนาเสร็จครบทุกแผน (ก่อนสรุปปิดงาน) — ต้องเตือนผู้ใช้
เมื่อแผน 1, 2, 3 เสร็จและ deploy ได้แล้ว ต้องเตือนผู้ใช้ 2 เรื่อง:
- **(ก)** รายการ QA/BA ด้านล่าง
- **(ข)** ถามว่าจะเริ่มงานเสริมประเภทห้องใหม่ (penthouse / duplex / full-floor ตามสเปกข้อ 14) เลยไหม — **ห้ามเริ่มเองจนกว่าผู้ใช้จะอนุญาต**

**(ก)** ให้บอกผู้ใช้ว่า "ถึงเวลาทำส่วน QA/BA สำหรับ portfolio แล้ว" แล้วสรุป checklist นี้:
1. ไล่ทดสอบตาม `docs/qa-ba/test-cases.md` ทีละข้อบนเว็บจริง (desktop + มือถือ) แล้วกรอกผลจริงและสถานะเอง
2. เจอบั๊กให้เปิด GitHub Issue ด้วย template "Bug report" และใส่เลข issue ใน test case
3. อัปเดต `docs/qa-ba/traceability-matrix.md` ให้ครบ
4. (แนะนำ) เขียน Playwright test เองอย่างน้อย 3 เคส ใน `apps/web/e2e/user-written/` ให้ Claude ช่วยแค่ใบ้และรีวิว
5. เขียนหัวข้อ "บทบาทของฉันและการใช้ AI" ใน README ด้วยคำของตัวเอง

## การสื่อสารกับผู้ใช้
- ผู้ใช้สื่อสารเป็นภาษาไทย ตอบเป็นภาษาไทย อธิบายแบบเข้าใจง่าย ไม่ใช้ศัพท์เทคนิคเกินจำเป็น
- ผู้ใช้เป็นเจ้าของ GitHub `rawinan-txt` ใช้ Claude Pro
