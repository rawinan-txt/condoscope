# Plan 6 — Scroll storytelling บนหน้าแรก และ View Transitions จากการ์ดสู่ Hero

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ใต้ส่วนค้นหาของหน้าแรกมีส่วน "เล่าเรื่อง" ที่ขับด้วยการเลื่อนหน้า: ภาพ Hero เปลี่ยนเป็นตึก 3D → กล้องหมุนรอบตึก → ไฟของห้องว่างสว่างทีละชั้น → ตัวเลขห้องว่างนับขึ้น → กล้องพุ่งเข้าห้อง ตัดเป็นภาพภายใน → ปุ่มเข้า Explorer · และเปลี่ยนหน้าจากการ์ดโครงการสู่ Hero ของหน้าโครงการด้วย View Transitions

**Architecture:** ตรรกะทั้งหมดเป็นฟังก์ชันบริสุทธิ์ของ "ความคืบหน้าการเลื่อน" `p ∈ [0,1]` (ท่ากล้อง, จำนวนชั้นที่สว่าง, ตัวเลข, ช่วงบท) จึงทดสอบด้วย Vitest ได้และถูกต้องแม้ผู้ใช้กระโดดข้ามกลางเรื่อง · ส่วน 3D ใช้ฉากเดิมของ Explorer (`Towers`, `City`, `Landscape`, `Sky`) ใน Canvas น้ำหนักเบาที่วาดเฉพาะเมื่อ `p` เปลี่ยน (`frameloop="demand"`) และมีตัวสำรองเป็นภาพนิ่ง 4 ภาพที่ถ่ายล่วงหน้าจากฉากเดียวกัน (ใช้บนเครื่องอ่อน, เน็ตช้า, ไม่มี WebGL) · เขียนตัวขับการเลื่อนเอง ไม่ใช้ GSAP/Lenis (เหตุผลด้านล่าง)

**Tech Stack:** React 19, three/R3F (มีอยู่แล้ว), React Router 8 (`Link viewTransition`, `useViewTransitionState` มีในเวอร์ชันที่ลงอยู่), Vitest, Playwright · **ไม่เพิ่ม dependency**

**Spec:** `docs/specs/2026-11-09-condoscope-design.md` ข้อ 8.1 (หน้าแรกเป็นหน้าค้นหา: ห้ามเปิดมาเจอ 3D ทันที — ส่วนนี้อยู่ใต้จอแรกและไม่โหลด 3D จนกว่าจะเลื่อนใกล้ จึงไม่ขัด แต่ควรเพิ่มบรรทัดในสเปกให้ชัด), 4.3, 5 (ภาพ AI + ป้ายกำกับ) · `docs/plans/2026-11-11-plan-5-luxury-look.md` (Hero, token สี, `useReveal`, `HeroImage`) · `docs/plans/2026-11-11-plan-4-ux-ui.md` (กล้อง `stepCamera`, `unitViewGoal`, `freeWidthFraction`)

**ก่อนเริ่ม:** แผน 5 ต้อง merge เข้า `main` ก่อน (แผนนี้ใช้ Hero, `HeroImage`, token และ `ProjectCard` ใหม่ของแผน 5) แล้วแตก `feat/plan-6` จาก `main`

## Global Constraints

- งบ 0 บาท; ไม่เพิ่ม dependency; ห้ามแตะฐานข้อมูลจริง/seed/secrets; ห้ามมีข้อมูลหรือภาพของโครงการจริง; ป้าย "ข้อมูลจำลอง" ทุกหน้า (คงเดิม); ภาพ AI ต้องมีป้าย
- **หน้าแรกต้องเป็นหน้าค้นหา: ช่องค้นหาต้องอยู่ในจอแรกที่ viewport 320×640, 390×844 และ ≥ 1024 โดยไม่ต้องเลื่อน** และจอแรกต้องไม่มี `<canvas>`/WebGL
- **ลดการเคลื่อนไหว (`prefers-reduced-motion: reduce`) = ปิดทั้งหมด:** ไม่ปักจอ (no sticky/pin), ไม่ scrub, ไม่มี View Transition, ไม่วาด 3D; แสดงเป็นเนื้อหานิ่งเรียงลงมาพร้อมภาพนิ่งและตัวเลขสุดท้ายทันที · ต้องตามการเปลี่ยนค่าขณะเปิดหน้าอยู่ด้วย
- **ห้ามแย่งการเลื่อน:** ไม่ใช้ smooth-scroll แบบจี้ล้อ (ไม่ใช้ Lenis), ไม่ `preventDefault` บน wheel/touch, listener เป็น `passive`; คีย์บอร์ด (Space, PageDown, ลูกศร) และการค้นหาในหน้า (Ctrl+F) ใช้งานได้ตามปกติ
- ใช้ `svh` ไม่ใช้ `vh` หรือค่าที่คำนวณจาก `innerHeight` (แถบ address bar ของ iOS ทำให้กระโดด) · มือถือใช้เฉพาะ `transform`/`opacity` ในการเคลื่อนไหว (ไม่ทำ layout)
- 3D ในส่วนนี้ไม่รับ pointer (`pointer-events: none`, `touch-action: pan-y`) เพื่อไม่ขวางการเลื่อน
- คอนทราสต์ข้อความ ≥ 4.5:1 ทุกบท (ตัวอักษรบนภาพ/ฉาก 3D ต้องมี scrim ตามแบบ `SCRIM` ของแผน 5 และมี test กรณีแย่สุด)
- งบ bundle: entry ≤ 105 KB gzip (ตัวโหลดของส่วนนี้ใน entry ≤ 3 KB), ชิ้นโค้ดของส่วนเล่าเรื่อง (ไม่รวม three ที่ใช้ร่วมกับ Building3D) ≤ 40 KB gzip (งบใหม่ `storyGzip` ใน `scripts/bundle-rules.mjs`), Building3D ≤ 600, แผนที่ ≤ 323 · ภาพนิ่งสำรองรวม ≤ 360 KB (4 ภาพ ภาพละ ≤ 90 KB)
- ไม่เปลี่ยน accessible name/role ที่ e2e เดิมใช้; UI ภาษาไทย

## เทียบ GSAP ScrollTrigger / Lenis กับเขียนเอง (วัดจริงเมื่อ 2026-11-12 โดยดาวน์โหลดแพ็กเกจมา gzip เอง)

| ตัวเลือก | gzip | ใบอนุญาต | ได้อะไร | เสียอะไร |
|---|---|---|---|---|
| GSAP core (`gsap` 3.15.1) | 27.8 KB | "Standard no-charge license" ใช้เชิงพาณิชย์ฟรีตั้งแต่ปี 2025 รวมปลั๊กอิน แต่มีข้อห้ามบางประเภท ([ข้อความอนุญาต](https://gsap.com/standard-license), [ประกาศของ Webflow](https://webflow.com/blog/gsap-becomes-free)) ต้องอ่านเต็มก่อนใช้ | timeline, scrub, easing ครบ | |
| + ScrollTrigger | +17.6 KB (รวม ≈ 45.4 KB) | เช่นเดียวกัน | pin, scrub, snap | entry ปัจจุบัน 97.3 KB บวก 45 = ~143 KB **เกินเพดาน 130** ถ้าอยู่ใน entry; ต้องแยกเป็นชิ้นโหลดทีหลังอยู่ดี และ timeline ของ GSAP ทดสอบหน่วยยาก |
| Lenis 1.3.27 | 8.0 KB | MIT | เลื่อนนุ่มแบบเฉื่อย | **จี้การเลื่อนของเบราว์เซอร์**: ขัดข้อกำหนด "ห้ามแย่งการเลื่อน", เสี่ยงกับ screen reader/ค้นหาในหน้า/คีย์บอร์ด, บน iOS การเลื่อนแบบเฉื่อยพื้นฐานนุ่มอยู่แล้ว ไม่คุ้ม |
| **เขียนเอง (เลือก)** | ≈ 1–2 KB: `position: sticky` + listener `scroll` แบบ passive + `requestAnimationFrame` คำนวณ `p` จาก `getBoundingClientRect` | — | ฟังก์ชัน `p → ท่า` ที่ทดสอบด้วยตัวเลขได้, ไม่มีใบอนุญาตให้ต้องตาม, ไม่เพิ่ม dependency | ต้องเขียน easing/ช่วงบทเอง (เล็กน้อย) และไม่มี snap |

ข้อสรุป: **เขียนเอง** — งานนี้ต้องการแค่ "p → ท่า" ซึ่งเป็นฟังก์ชันคณิตศาสตร์ตรงๆ และเหตุผลหลักที่ไม่ใช้คือขนาด (GSAP ดันเกินเพดาน entry) กับการแย่งการเลื่อน (Lenis) · ถ้าภายหลังต้องการ snap/timeline ซับซ้อน ค่อยพิจารณา GSAP แบบโหลดเฉพาะชิ้นเล่าเรื่อง

## ตัดสินใจแทนผู้ใช้ — ขอให้ตรวจก่อนอนุมัติ

| # | เรื่อง | ที่เลือก | เหตุผล / ถ้าไม่เห็นด้วย |
|---|---|---|---|
| 1 | ตัวขับการเลื่อน | เขียนเอง (ตารางข้างบน) | ขนาดและไม่แย่งการเลื่อน; GSAP ใช้ได้ถ้ายอมให้ส่วนนี้โหลดตอนเลื่อนและยอมรับใบอนุญาต |
| 2 | ความยาวส่วนเล่าเรื่อง | สูง `500svh` บนจอใหญ่, `380svh` บนมือถือ มีเวทีปัก (sticky) สูง `100svh` | ยาวพอให้ 6 บทไม่รีบ แต่ไม่ยาวจนผู้ใช้ติด; **มีลิงก์ "ข้ามส่วนนี้" เป็นปุ่มแรกในส่วน** (ผู้ใช้คีย์บอร์ดไม่ต้องกด Tab ผ่านเวที) |
| 3 | โครงการที่เล่า | โครงการ `is_featured` (ตัวเดียวกับ Hero) ใช้ข้อมูลจริงจาก `getExplorer(id)` (ตัวเลขห้องว่างมาจากข้อมูลจริง/สำรองตามแบนเนอร์ที่มีอยู่ ไม่ปลอมเป็น live) | เรื่องเดียวต่อเนื่องกับ Hero; ห้องที่พุ่งเข้าหาเลือกแบบกำหนดแน่นอน (`pickShowcaseUnit`): ห้องว่างชั้นกลาง-สูงของด้านหน้า |
| 4 | 3D หรือภาพนิ่ง | 3 ชั้น: **live 3D** (เครื่องแรง) → **ภาพนิ่ง scrub** (เครื่องอ่อน/เน็ตช้า/`saveData`/ไม่มี WebGL/สลับตัวเองถ้าเฟรมช้า) → **เนื้อหานิ่ง** (ลดการเคลื่อนไหว) | ต้องลื่นบนมือถือ: ฉากเมืองของ Explorer หนักสำหรับมือถือรุ่นล่าง ภาพนิ่ง 4 ภาพ crossfade ตาม `p` ลื่นทุกเครื่อง; ภาพนิ่งถ่ายจากฉากเดียวกันด้วยสคริปต์ จึงไม่ต้องเจนภาพใหม่ |
| 5 | Canvas 3D ของส่วนนี้ | เบากว่า Explorer: ไม่มี SSAO/เงา/multisample, `antialias` เฉพาะเครื่องแรง, `dpr` ≤ 1.25 (มือถือ ≤ 1), `frameloop="demand"` วาดเฉพาะเมื่อ `p` เปลี่ยน | หยุดเลื่อน = GPU ว่าง (ประหยัดแบตมือถือ); ใช้ `Towers`/`City`/`Landscape`/`Sky` เดิมเพื่อไม่ให้ตึกหน้าตาไม่ตรงกับ Explorer |
| 6 | ตัดเป็นภาพภายใน | เมื่อกล้องถึงหน้าต่างของห้องที่เลือก วงกลม/ช่องหน้าต่างขยายจากจุดห้องบนจอ เผยภาพห้องนั่งเล่นของประเภทห้องนั้น (ภาพ AI เดิม มีป้าย) | match-cut ที่จุดห้องจริง ต้องรู้ตำแหน่งห้องบนจอ (`projectUnit` มีอยู่แล้ว) ถ้า 3D ไม่ทำงาน ตัดแบบ crossfade |
| 7 | การ์ด → Hero (View Transitions) | การ์ดใช้ภาพ AI ขนาดเล็ก `<slug>-hero-sm.webp` (สำรอง: ภาพ 3 มิติเดิม) เพื่อให้ภาพเดียวกับ Hero ของหน้าโครงการ morph ต่อเนื่อง; ส่งข้อมูลโครงการที่การ์ดมีอยู่แล้วไปกับ `location.state` ให้หน้าโครงการแสดง Hero ทันทีก่อนข้อมูลเต็มโหลดเสร็จ | ถ้าไม่ส่ง state หน้าปลายทางจะเป็นโครงกระดูกตอนที่เบราว์เซอร์ถ่ายภาพ "หลัง" → morph ไปหาโครงกระดูก; ตั้ง `view-transition-name` เฉพาะการ์ดที่ถูกกด (`useViewTransitionState`) เพราะชื่อซ้ำทำให้ transition ล้มเหลว |
| 8 | เบราว์เซอร์ที่ไม่รองรับ | Chrome/Edge 111+, Safari 18+, Firefox 144+ รองรับ same-document view transition ([web.dev](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available)); รุ่นเก่ากว่านั้นเปลี่ยนหน้าแบบปกติ ไม่พัง | ใช้ `Link viewTransition` ของ React Router (ตรวจ `document.startViewTransition` ในตัว); เฉพาะการไปข้างหน้า ปุ่มย้อนกลับของเบราว์เซอร์ไม่มี transition (ยอมรับ) |
| 9 | ระยะดาวน์โหลดตอนเลื่อน | ไม่โหลด 3D/ข้อมูลตึกจนส่วนนี้อยู่ห่างจอ ≤ 1.5 จอ และหน้าว่าง (`requestIdleCallback`); ข้ามเมื่อ `navigator.connection.saveData` หรือ `effectiveType` ≤ 3g → ใช้ภาพนิ่งอย่างเดียว | ผู้ใช้ที่เลื่อนลงมาต้องโหลดเพิ่มราว 300 KB gzip (ชิ้น three ที่ Explorer ใช้อยู่แล้ว + ข้อมูลตึก); ถ้าไม่ยอมรับต้นทุนนี้ ให้ใช้ภาพนิ่งอย่างเดียวทุกเครื่อง (Task 5–6 ตัดได้โดยไม่กระทบส่วนอื่น) |
| 10 | สเปกข้อ 8.1 | เพิ่มประโยคในสเปก: "ส่วนเล่าเรื่องใต้ช่องค้นหาได้ ถ้าจอแรกยังเป็นช่องค้นหาและไม่มี 3D" — **ผมจะไม่แก้สเปกเอง ขอให้ผู้ใช้ยืนยัน** | CLAUDE.md ให้อ่านสเปกล่าสุดจากดิสก์ก่อนแก้ทุกครั้ง |
| 11 | งานเสริมประเภทห้องใหม่ | ไม่อยู่ในแผนนี้ | ผู้ใช้ยังไม่อนุญาต |

## ไฟล์ที่เกี่ยวข้อง

- สร้าง: `apps/web/src/features/story/{scroll.ts, scroll.test.ts, timeline.ts, timeline.test.ts, useScrollProgress.ts, useScrollProgress.test.tsx, StorySection.tsx, StorySection.test.tsx, StoryStills.tsx, StoryScene.tsx, StoryLoader.tsx, Counter.tsx, tier.ts, tier.test.ts}`, `apps/web/scripts/story-stills.mjs` (+ `public/images/story/still-{1..4}.webp`), `apps/web/e2e/story.spec.ts`
- แก้: `features/home/HomePage.tsx` (+ test), `features/explorer/scene/Towers.tsx` (รับ `storyFloor` เพิ่ม), `components/ProjectCard.tsx`, `features/project/ProjectPage.tsx`, `index.css` (`view-transition-*`, sticky stage), `scripts/bundle-rules.mjs` (+ test), `package.json` (สคริปต์ `story-stills`), เอกสาร
- ไม่แตะ: `apps/api`, `packages/shared`, `database/`, `.github/`, Explorer เองยกเว้น `Towers.tsx` (เพิ่ม prop ที่ไม่ใส่ = พฤติกรรมเดิม)

## Review Focus

1. **iOS Safari แถบ address bar หด/ขยายขณะเลื่อน:** `p` ต้องไม่กระโดด และเวทีไม่กะพริบ → ใช้ `svh` และคำนวณ `p` จากตำแหน่งสัมพัทธ์ของส่วน (ไม่ใช้ `innerHeight`) (Task 1, 3)
2. **ผู้ใช้เข้ากลางเรื่อง** (รีเฟรชหน้า, ปุ่มย้อนกลับคืนตำแหน่งเลื่อน, ลิงก์ anchor, เลื่อนเร็วข้ามบท): ภาพทุกอย่างต้องเป็นฟังก์ชันของ `p` ปัจจุบัน ไม่ใช่สถานะสะสม และ 3D ที่เพิ่งเมานต์ต้องวาดเฟรมถูกต้องตั้งแต่เฟรมแรก (Task 2, 5)
3. **3D ล้ม** (WebGL context หาย, ชิ้นโค้ดโหลดไม่ได้, API ข้อมูลตึกล้มและใช้ข้อมูลสำรอง): เวทีต้องไม่ว่างเปล่า สลับเป็นภาพนิ่งและเรื่องเล่าต่อได้ (Task 5)
4. **ลดการเคลื่อนไหวถูกสลับขณะอยู่ในหน้า / เบราว์เซอร์ไม่มี IntersectionObserver หรือ View Transitions:** เนื้อหาไม่ถูกซ่อนค้าง, ไม่มีเวทีปักค้าง (Task 3, 7)
5. **จอ 320 px และขยายตัวอักษร 200%:** คำบรรยายแต่ละบท ตัวเลขใหญ่ และปุ่ม CTA ต้องไม่ล้น ไม่ทับกัน ไม่เกิดเลื่อนแนวนอน (Task 3, 8)
6. **ตัวเลขห้องว่าง = 0 หรือโครงการไม่มีตึกให้เลือกห้อง:** ส่วนเล่าเรื่องต้องไม่แสดงเรื่องที่ไม่จริง (ซ่อนส่วนทั้งหมดหรือแสดงข้อความนิ่ง) (Task 2, 3)

---

### Task 1: ตัวขับการเลื่อน (`scroll.ts`, `useScrollProgress`)

**Files:** Create `features/story/scroll.ts`, `scroll.test.ts`, `useScrollProgress.ts`, `useScrollProgress.test.tsx`

**Interfaces:**
- Produces: `clamp01(x: number): number` · `remap(p: number, from: number, to: number): number` (0 ก่อน `from`, 1 หลัง `to`, เส้นตรงระหว่าง; `from >= to` → ขั้นบันได ไม่หารศูนย์) · `easeInOut(t: number): number` · `sectionProgress(rect: { top: number; height: number }, viewportH: number): number` (= `clamp01(-rect.top / (rect.height - viewportH))`, ส่วนสั้นกว่าจอ → 0) · `useScrollProgress(ref: RefObject<HTMLElement>, onChange: (p: number) => void): void` — ฟังการเลื่อนแบบ passive, เรียก `onChange` อย่างมากหนึ่งครั้งต่อเฟรม (rAF) และเฉพาะเมื่อค่าเปลี่ยน, เรียกหนึ่งครั้งตอนเมานต์ (รองรับเข้ากลางเรื่อง), ล้าง listener ตอนถอด

- [ ] **Step 1: เขียน test ที่ล้ม** — `remap(0.5, 0.25, 0.75) === 0.5`, `remap(-1,0,1) === 0`, `remap(2,0,1) === 1`, `remap(0.3, 0.5, 0.5)` ไม่ใช่ NaN; `easeInOut(0)=0`, `(1)=1`, `(0.5)=0.5` และเพิ่มขึ้นเรื่อยๆ; `sectionProgress({top:0,height:1000},500)=0`, `{top:-250,...}=0.5`, `{top:-9999,...}=1`, `{top:0,height:300}` กับ viewport 500 = 0 · hook (jsdom, ปลอม `requestAnimationFrame` และ `getBoundingClientRect`): เลื่อน 5 ครั้งใน 1 เฟรม → `onChange` 1 ครั้ง; ไม่เปลี่ยนค่า → ไม่เรียกซ้ำ; เมานต์ครั้งแรกเรียก 1 ครั้งด้วยค่าปัจจุบัน; ถอด → `removeEventListener('scroll', …)` และ listener ลงทะเบียนด้วย `{ passive: true }`
- [ ] **Step 2: รันให้ล้ม** `npm test -w web -- features/story`
- [ ] **Step 3: เขียนตามอินเทอร์เฟซ** (ไม่ใช้ `window.innerHeight`: รับความสูงเวทีจาก `rect` ของลูกที่ sticky หรือ `document.documentElement.clientHeight` เพื่อให้ตรงกับ `svh`)
- [ ] **Step 4: รันให้ผ่าน** แล้ว `npm run typecheck`
- [ ] **Step 5: Commit** `feat(web): scroll progress engine for the story section`

### Task 2: ไทม์ไลน์ของเรื่อง (ฟังก์ชันบริสุทธิ์)

**Files:** Create `features/story/timeline.ts`, `timeline.test.ts`

**Interfaces:**
- Consumes: `Bounds`, `homeView`, `unitViewGoal`, `towerTop`, `unitWorldCenter` จาก `explorer/scene/layout.ts`; `remap`, `easeInOut` (Task 1); `Unit`, `Building` จาก shared
- Produces:
  - `export const CHAPTERS = ['hero','orbit','lights','count','dive','cta'] as const` และ `chapterAt(p: number): (typeof CHAPTERS)[number]` (ขอบบทเป็นค่าคงที่ในไฟล์ ช่วงทับกันไม่ได้)
  - `crossfadeToScene(p: number): number` (0→1 ในบท hero)
  - `orbitPose(b: Bounds, p: number): { position: Vec3; target: Vec3 }` (หมุนครบ ≈ 200° ที่รัศมีคงที่จาก `homeView`; ไม่ต่ำกว่าพื้น)
  - `litFloors(p: number, firstFloor: number, lastFloor: number): number` (จำนวนชั้นที่สว่าง จาก 0 ถึง `lastFloor − firstFloor + 1` เป็นจำนวนเต็ม ไม่ลดลงเมื่อ `p` เพิ่ม)
  - `countAt(p: number, total: number): number` (จำนวนเต็ม 0..`total` ไม่ลดลง ถึง `total` พอดีเมื่อจบบท count)
  - `diveGoal(b: Building, u: Unit, p: number, from: { position: Vec3; target: Vec3 }): { position: Vec3; target: Vec3 }` (ไหลจากท่าสุดท้ายของ orbit ไป `unitViewGoal`)
  - `interiorReveal(p: number): number` (0→1 ช่วงท้ายของ dive)
  - `pickShowcaseUnit(units: Unit[], b: Building): Unit | null` (กำหนดแน่นอน: ห้อง `available` ด้านหน้าชั้นใกล้ 60% ของตึก, ทิศทางเสมอกันตัดสินที่ `id` น้อยสุด; ไม่มีห้องว่าง → `null`)

- [ ] **Step 1: เขียน test ที่ล้ม** — `chapterAt` ที่ 0, 0.2, 0.5, 0.8, 1 ตรงตารางบท; `countAt(0,N)=0`, `countAt(1,N)=N`, ลูปทุก `p` ทีละ 0.01 ได้ลำดับไม่ลดและไม่เกิน `N`, `N=0` → 0 ทุก `p`; `litFloors` เช่นเดียวกันและเป็นจำนวนเต็ม; `orbitPose`: ระยะจากเป้าหมายคงที่ (±1%) ทุก `p`, ความสูงกล้อง > 0, `p=0` ตรงกับ `homeView`; `diveGoal(...,1)` เท่ากับ `unitViewGoal` และ `(...,0)` เท่ากับ `from`; `pickShowcaseUnit` กำหนดแน่นอน (เรียกซ้ำได้ค่าเดิม), ไม่คืนห้องที่ไม่ว่าง, `[]` และ "ไม่มีห้องว่าง" → `null` · **กระโดดข้าม:** ค่าที่ `p=0.9` คำนวณโดยไม่ผ่านค่าก่อนหน้าเท่ากับค่าที่ได้เมื่อไล่ผ่านทุก `p`
- [ ] **Step 2: รันให้ล้ม** `npm test -w web -- timeline`
- [ ] **Step 3: เขียนตามอินเทอร์เฟซ** (ขอบบทและค่าหมุนเป็นค่าคงที่ที่ส่งออก เพื่อให้ Task 3–6 อ้างตรงกัน)
- [ ] **Step 4: รันให้ผ่าน**
- [ ] **Step 5: Commit** `feat(web): story timeline as pure functions of scroll progress`

### Task 3: เปลือกของส่วนเล่าเรื่องบนหน้าแรก (ภาพนิ่งก่อน)

**Files:** Create `StorySection.tsx`, `StorySection.test.tsx`, `StoryStills.tsx`, `Counter.tsx`, `tier.ts`, `tier.test.ts` · Modify `HomePage.tsx`, `HomePage.test.tsx`, `index.css`

**Interfaces:**
- Produces: `chooseTier(env: { reducedMotion: boolean; saveData: boolean; effectiveType?: string; hasWebGL: boolean; cores?: number; memoryGb?: number; coarsePointer: boolean; width: number }): 'static' | 'stills' | 'live'` — ลำดับ: `reducedMotion` → `static`; `saveData` หรือ `effectiveType` ใน `slow-2g|2g|3g` หรือ ไม่มี WebGL → `stills`; `cores ≤ 4` หรือ `memoryGb ≤ 4` หรือ (`coarsePointer` และ `width < 768`) → `stills`; นอกนั้น `live` · `<StorySection project={Project} />` (เวที sticky + บทบรรยาย + ตัวเลข + CTA) และ `<StoryStills p={number} />` (4 ภาพ crossfade ตาม `p`, `alt=""` ตกแต่ง)

- [ ] **Step 1: test ที่ล้ม** — `chooseTier` ครอบทุกกิ่ง (ตารางข้างบน รวม `undefined` ของ `cores`/`memoryGb` ที่ต้องไม่ล้ม) · `StorySection`: ปุ่ม/ลิงก์ "ข้ามส่วนนี้" เป็นองค์ประกอบโฟกัสได้ตัวแรกในส่วนและพาไปส่วนถัดไป; ทุกบทมีข้อความอยู่ใน DOM เสมอ (screen reader อ่านครบโดยไม่ต้องเลื่อน); เมื่อ `reducedMotion` → ไม่มี sticky, ไม่มีเวที, แสดงตัวเลขสุดท้ายและปุ่ม CTA ทันที, เปลี่ยนค่า `matchMedia` ขณะเปิดอยู่แล้วสลับได้; `Counter` ให้ค่าที่ `p` ตรงกับ `countAt` และ `aria-live` ไม่ประกาศทุกตัวเลข (ประกาศเฉพาะค่าสุดท้าย) · `HomePage`: ส่วนเล่าเรื่องอยู่หลัง Hero และก่อน "ทำเลยอดนิยม", **ไม่มี `<canvas>` ก่อนส่วนนี้ใกล้จอ**, ถ้าโครงการแนะนำไม่มีห้องว่างหรือไม่มีตึก → ไม่เรนเดอร์ส่วนนี้เลย; ปรับ test เดิม "has no map and no 3D canvas on the home page" ให้ตรงกับพฤติกรรมนี้และลำดับหัวข้อ spec 8.1 ใหม่
- [ ] **Step 2: รันให้ล้ม** `npm test -w web -- features/story features/home`
- [ ] **Step 3: เขียน** — เวที `sticky top-0 h-svh`, ส่วนสูง `500svh`/`380svh`; ข้อความทุกบทมี scrim ตาม `SCRIM`; `p` ถูกส่งผ่าน ref/CSS custom property `--p` ไม่ใช้ `useState` ต่อเฟรม (state เปลี่ยนเฉพาะเมื่อ `chapterAt` เปลี่ยน); ตัดสินใจ tier ครั้งเดียวตอนเมานต์และเมื่อค่าลดการเคลื่อนไหวเปลี่ยน
- [ ] **Step 4: ภาพนิ่งชั่วคราว** ถ้ายังไม่มี `public/images/story/still-*.webp` ให้ `StoryStills` ใช้ภาพ Hero ของโครงการแทน (ไม่มีรูปแตก) — ของจริงมาใน Task 4
- [ ] **Step 5: รัน** `npm test -w web`, `npm run typecheck`, `npm run build -w web && npm run check:bundles -w web` — Expected: ผ่าน, entry ไม่เกิน 105 KB
- [ ] **Step 6: Commit** `feat(web): scroll story section on the home page (stills tier)`

### Task 4: ถ่ายภาพนิ่ง 4 ภาพจากฉาก 3D

**Files:** Create `apps/web/scripts/story-stills.mjs`, `public/images/story/still-1..4.webp` · Modify `apps/web/package.json` (สคริปต์ `story-stills`)

- [ ] **Step 1: เขียนสคริปต์** แบบเดียวกับ `capture-thumbnails.mjs`: เปิด Explorer ของโครงการแนะนำด้วย Playwright (software WebGL) ซ่อน UI ทุกอย่าง (`.glass`, ปุ่ม) ตั้งกล้องผ่าน `window.__condoscope` หรือ URL ตามท่าจาก `orbitPose`/`diveGoal` ที่ `p` = 0.05, 0.3, 0.6, 0.85 (พลบค่ำ) แล้วบันทึก WebP ความกว้าง 1376 และ 720 สำหรับมือถือ
- [ ] **Step 2: ตรวจ** ขนาดไฟล์ ≤ 90 KB ต่อภาพ (ลดคุณภาพถ้าเกิน) และ**ดูภาพทุกภาพเอง**ว่ามีแต่ตึก ไม่มีแผง/เมาส์/แบนเนอร์
- [ ] **Step 3: test** `StoryStills` ที่ `p = 0`/`0.5`/`1` ให้ opacity ของภาพที่ 1 / ภาพที่ 2 และ 3 ผสมกัน / ภาพที่ 4 ตามลำดับ (ผลรวม opacity ≈ 1 ไม่มีช่วงที่ว่างเปล่า)
- [ ] **Step 4: Commit** `feat(web): pre-rendered stills for the story section`

### Task 5: ฉาก 3D ของส่วนเล่าเรื่อง (tier `live`)

**Files:** Create `StoryScene.tsx`, `StoryLoader.tsx` · Modify `explorer/scene/Towers.tsx` (เพิ่ม prop `storyFloor?: number`), `StorySection.tsx`, `scripts/bundle-rules.mjs` (+ test)

**Interfaces:**
- Consumes: `orbitPose`, `diveGoal`, `litFloors`, `pickShowcaseUnit` (Task 2); `Towers`, `City`, `Landscape`, `Sky`; `getExplorer` จาก `services/api`
- Produces: `<StoryScene data={ExplorerPayload} p={MutableRefObject<number>} onFailure={() => void} />`; `Towers` prop ใหม่ `storyFloor?: number` — ถ้ามี: ห้อง `available` ที่ `floor_number − first_res_floor < storyFloor` สว่างสีแชมเปญ (ใช้ทางเดียวกับ `role.kind === 'status'`) ห้องอื่นมืด; ถ้าไม่ใส่ = พฤติกรรมเดิมทุกประการ · `StoryLoader` — `import()` ชิ้นนี้และเรียก `getExplorer` เมื่อส่วนอยู่ห่างจอ ≤ 1.5 จอ และว่าง (รายละเอียดข้อ 9)

- [ ] **Step 1: test ที่ล้ม** — `Towers` ที่ไม่ใส่ `storyFloor` ให้ role เดิมทุกห้อง (snapshot ของ `unitColorRole`/ผลของ prop เทียบเดิม); ที่ `storyFloor = k` ห้องว่างชั้นต่ำกว่า k สว่าง ที่สูงกว่ามืด และห้องที่ไม่ว่างมืดเสมอ · `StoryLoader`: ไม่เรียก `import()`/`getExplorer` จนกว่าจะ intersect, ไม่เรียกเมื่อ `saveData`, เรียกครั้งเดียวแม้ intersect ซ้ำ · `bundle-rules`: ชิ้น `Story*` เกิน 40 KB ต้องล้ม
- [ ] **Step 2: รันให้ล้ม**
- [ ] **Step 3: เขียน `StoryScene`** — `<Canvas frameloop="demand" dpr={[1, mobile ? 1 : 1.25]} gl={{ antialias: !mobile, powerPreference: 'high-performance' }} style={{ pointerEvents: 'none', touchAction: 'pan-y' }} aria-hidden>`; ไม่มี SSAO/เงา; ตัวขับกล้องอ่านค่า `p.current` แล้ว `invalidate()` เฉพาะเมื่อ `p` เปลี่ยน; **กล้องตั้งจาก `p` ปัจจุบันตั้งแต่เฟรมแรก** (เข้ากลางเรื่องได้); ตรวจ `webglcontextlost` และข้อผิดพลาดของ `import()` แล้วเรียก `onFailure` → `StorySection` สลับเป็นภาพนิ่ง
- [ ] **Step 4: ตัวตรวจเฟรมช้า** วัดเวลาเฉลี่ย 30 เฟรมแรกที่เกิดการเลื่อน ถ้า > 28 ms ต่อเฟรม → `onFailure()` (สลับเป็นภาพนิ่งอย่างถาวรในเซสชัน) — **เป็นแนวคิดเดียวกับ `onSlow` ที่ Explorer มีอยู่**
- [ ] **Step 5: รัน** `npm test -w web`, `npm run build -w web && npm run check:bundles -w web` (entry ≤ 105, ชิ้นเล่าเรื่อง ≤ 40, Building3D ≤ 600) — Expected: ผ่าน
- [ ] **Step 6: Commit** `feat(web): live 3D tier for the story section, with automatic fallback to stills`

### Task 6: ลำดับบท: ไฟ ตัวเลข พุ่งเข้าห้อง ตัดภาพภายใน CTA

**Files:** Modify `StorySection.tsx`, `StoryScene.tsx`, `Counter.tsx`, `index.css` + test ที่เกี่ยวข้อง

**Interfaces:** Consumes: `litFloors`, `countAt`, `diveGoal`, `interiorReveal`, `pickShowcaseUnit`, `imageFile`/`UNIT_TYPE_LABEL` จาก shared, `projectUnit` (ตะขอใน `Building3D`; ถ้าไม่ใช้ได้ให้คำนวณตำแหน่งบนจอจาก `Camera.project` ของ `StoryScene` เอง)

- [ ] **Step 1: test ที่ล้ม** — ที่ `p` จบบท `count` ตัวเลขบนจอเท่ากับจำนวนห้อง `available` จริงของโครงการ (ตรงกับตาราง "ห้องว่าง" ของหน้าโครงการ); ที่ `p = 1` มีลิงก์ "เข้าสำรวจตึกนี้" ไป `/explorer/:id?unit=<id ห้องที่เลือก>` (และเมื่อ `reducedMotion` ก็มีโดยไม่ต้องเลื่อน); ภาพภายในของห้องที่เลือกใช้ภาพ `living` ของประเภทห้องนั้นพร้อมป้าย AI; ข้อความ "ห้องว่าง N ห้อง" ใน DOM เป็นค่าสุดท้ายเสมอ (ไม่นับขึ้นสำหรับ screen reader) · ถ้าข้อมูลมาจาก fallback ตัวเลขยังแสดงได้ แต่แบนเนอร์ Demo Fallback Mode ยังขึ้นตามเดิม (ไม่แสดงเป็นข้อมูล live)
- [ ] **Step 2: รันให้ล้ม**
- [ ] **Step 3: เขียน** ค่า `storyFloor = litFloors(p, …)` ส่งเข้า `Towers`; ตัวเลขใหญ่แบบ serif ของแผน 5; ช่องหน้าต่างขยาย (`clip-path`/`mask` บน `transform`/`opacity` เท่านั้น) ที่จุดห้องบนจอ ตามค่า `interiorReveal`; ปุ่ม CTA โผล่ในบท `cta` (ใช้ `pointer-events` ปกติ ปุ่มต้องกดได้แม้อยู่ในเวที sticky)
- [ ] **Step 4: รัน** `npm test -w web`
- [ ] **Step 5: Commit** `feat(web): story chapters - lights, counter, dive into the room, CTA`

### Task 7: View Transitions จากการ์ดสู่ Hero

**Files:** Modify `components/ProjectCard.tsx`, `features/project/ProjectPage.tsx`, `index.css`, `components/ProjectCard.test.tsx`, `features/project/ProjectPage.test.tsx`

**Interfaces:** Consumes: `heroSrc`/`HeroImage` (แผน 5), `useReducedMotion`; `Link` กับ `viewTransition` และ `useViewTransitionState(to)` จาก `react-router` · Produces: การ์ดส่ง `state: { project: Project }` ไปกับลิงก์; `ProjectPage` อ่าน `useLocation().state?.project` (ตรวจรูปแบบก่อนใช้ ห้ามเชื่อ state ที่ไม่ตรง `Project`) เพื่อแสดง Hero และชื่อทันทีก่อนข้อมูลเต็มมา

- [ ] **Step 1: test ที่ล้ม** — การ์ดยังมีลิงก์เดียวชื่อ "ดูรายละเอียด" ไป `/project/:id`; ลิงก์มี `viewTransition` เมื่อไม่ลดการเคลื่อนไหว และ **ไม่มี** เมื่อลดการเคลื่อนไหว; `view-transition-name` ตั้งเฉพาะบนภาพของการ์ดที่กำลังเปลี่ยนหน้า (การ์ดอื่นไม่มี → ไม่ซ้ำกัน); `ProjectPage` เปิดตรงๆ ผ่าน URL (ไม่มี state) ยังทำงานปกติ; state ที่ผิดรูป (`{project: 5}`) ถูกเมิน; ระหว่างโหลดมี Hero และชื่อจาก state ก่อนข้อมูลเต็ม
- [ ] **Step 2: รันให้ล้ม**
- [ ] **Step 3: เขียน** การ์ดใช้ภาพ `-hero-sm.webp` (สำรอง thumbnail เดิม) และ `ProjectPage` ตั้ง `view-transition-name` เดียวกันบน Hero เมื่อ `useViewTransitionState` เป็นจริง; CSS: `::view-transition-group(project-hero) { animation-duration: 600ms; animation-timing-function: ease-in-out }` และใน `@media (prefers-reduced-motion: reduce)` ปิดทุก `::view-transition-*` (`animation: none`)
- [ ] **Step 4: รัน** `npm test -w web`, `npm run typecheck`
- [ ] **Step 5: Commit** `feat(web): card-to-hero view transition with instant hero from router state`

### Task 8: e2e การเข้าถึงและประสิทธิภาพ

**Files:** Create `apps/web/e2e/story.spec.ts` · Modify `e2e/journeys.spec.ts` (axe หน้า `#/` ให้เลื่อนผ่านส่วนเล่าเรื่องด้วย)

- [ ] **Step 1: เขียน e2e** — (ก) จอแรกที่ 320×640, 390×844, 1400×900: ช่องค้นหาอยู่ใน viewport, `document.querySelectorAll('canvas').length === 0`, `scrollWidth <= clientWidth` (ข) เลื่อนด้วย `mouse.wheel` ไปสุดส่วน → ตัวเลขห้องว่างเท่าค่าจาก `data`, มีลิงก์ "เข้าสำรวจตึกนี้" ที่กดแล้วไป `/explorer/:id?unit=` และห้องนั้นถูกเลือกในแผง (ค) **เข้ากลางเรื่อง:** ตั้ง `scrollY` ตรงกลางส่วนแล้วรีโหลด → ไม่เกิดเวทีว่าง และตัวเลขสอดคล้องกับตำแหน่ง (ง) `emulateMedia({ reducedMotion: 'reduce' })` → ไม่มี `position: sticky` ในส่วน, ไม่มี canvas, ตัวเลขสุดท้ายและ CTA เห็นทันที, การ์ดกดแล้วไปหน้าโครงการโดยไม่เรียก `document.startViewTransition` (จำลองด้วย `addInitScript` ที่ห่อฟังก์ชัน) (จ) บล็อกชิ้น 3D (`route.abort()`) → เวทีสลับเป็นภาพนิ่ง ไม่ว่างเปล่า (ฉ) **ไม่วาดซ้ำเมื่อหยุดเลื่อน:** หลังหยุด 1 วินาที จำนวนเฟรมที่ `gl.info.render.frame` ไม่เพิ่ม (ช) คีย์บอร์ด: ปุ่ม "ข้ามส่วนนี้" เป็น Tab ตัวแรกของส่วนและพาไปส่วนถัดไป; กด `End`/`PageDown` เลื่อนผ่านส่วนได้ (ซ) axe บนหน้า `#/` ที่ตำแหน่งต้น/กลาง/ปลายส่วน ไม่มีปัญหาระดับ serious/critical
- [ ] **Step 2: รัน** `npm run e2e` (รอบเต็ม `--reporter=list`) — Expected: ผ่านทั้งหมด (e2e ใช้ software WebGL วัด FPS ไม่ได้ → ข้อ (ฉ) ตรวจพฤติกรรม ไม่ตรวจความเร็ว)
- [ ] **Step 3: Commit** `test(web): e2e for the story section - first screen, reduced motion, fallbacks, keyboard`

### Task 9: เอกสาร และรายการ test case ที่อาจล้าสมัย

**Files:** Modify `README.md`, `docs/architecture.md` (หัวข้อ "Scroll story": ตัวขับ ไทม์ไลน์ 3 tier ข้อควรระวัง), `CLAUDE.md`, `docs/screenshots/*` (เพิ่มภาพส่วนเล่าเรื่อง 2–3 ตำแหน่ง) · **ไม่แก้สเปกเอง:** แจ้งผู้ใช้ให้ยืนยันบรรทัดใหม่ของข้อ 8.1

- [ ] **Step 1: ตรวจเต็มชุด** `npm run typecheck`, `npm test`, `npm run build -w web && npm run check:bundles -w web`, `npm run e2e` — ผ่านทั้งหมด (ล้ม = รายงานตามจริง ไม่ลดเกณฑ์)
- [ ] **Step 2: ดูภาพหน้าจอจริงเอง** ที่ 1400×900, 390×844 และ 320×640 ของทุกบท
- [ ] **Step 3: แจ้งรายการ test case QA/BA ที่อาจล้าสมัย (ไม่แก้ให้):** TC ของหน้าแรก (ลำดับส่วน, "ไม่มี 3D บนหน้าแรก" — ตอนนี้มีส่วนเล่าเรื่อง), การ์ดและการเปลี่ยนหน้าไปหน้าโครงการ, ลดการเคลื่อนไหว, `user-flow.md`
- [ ] **Step 4: Commit** `docs: plan 6 status, architecture and screenshots`

### Task 10 (🧑 ผู้ใช้): ลองบนเครื่องจริง

- [ ] มือถือจริง iOS Safari และ Android Chrome: ลื่นไหม, แถบ address bar หด/ขยายแล้วภาพกระตุกไหม, สลับเป็นภาพนิ่งเองบนเครื่องอ่อนไหม · เครื่องที่ตั้ง "ลดการเคลื่อนไหว" · screen reader (NVDA/VoiceOver) อ่านบทครบและข้ามส่วนได้ · Firefox ≥ 144 และรุ่นเก่า (View Transitions) · ผม (Claude) วัด FPS บนเครื่องจริงไม่ได้ ผล e2e เป็นแค่การตรวจพฤติกรรม

## Self-review (ตรวจเทียบคำสั่งแล้ว)

- ครอบคลุม: scroll storytelling ใต้ส่วนค้นหา (T3), Hero→ตึก 3D (T3 ภาพนิ่ง + T5 live, T6), กล้องหมุนรอบตึก (T2 `orbitPose`, T5), ไฟห้องว่างสว่างทีละชั้น (T2 `litFloors`, T5 `Towers.storyFloor`, T6), ตัวเลขนับขึ้น (T2 `countAt`, T6), พุ่งเข้าห้อง + ตัดภาพภายใน (T2 `diveGoal`/`interiorReveal`, T6), ปุ่มเข้า Explorer (T6), View Transitions การ์ด→Hero (T7), เทียบ GSAP/Lenis/เขียนเอง พร้อมขนาดที่วัดจริง (ตาราง), ลื่นบนมือถือ (tier, `frameloop="demand"`, `svh`, transform/opacity), ปิดทั้งหมดเมื่อลดการเคลื่อนไหว (ข้อบังคับ + T3, T7, T8), ช่องค้นหาในจอแรก (ข้อบังคับ + T8 ข้อ ก)
- ชื่อข้าม task ตรงกัน: `remap`/`easeInOut`/`sectionProgress` (T1→T2), `orbitPose`/`diveGoal`/`litFloors`/`countAt`/`pickShowcaseUnit`/`interiorReveal` (T2→T5, T6), `chooseTier` (T3), `Towers.storyFloor` (T5→T6), `heroSrc`/`HeroImage` (แผน 5 → T7)
- ที่ผมไม่แน่ใจและต้องพิสูจน์ตอนทำ: (1) `Link viewTransition` ทำงานกับ `HashRouter` ตามที่คาด (ตรวจใน Task 7 Step 1 ด้วย test และบนเบราว์เซอร์จริง) (2) ตะขอ `projectUnit` ใช้กับ canvas ของส่วนเล่าเรื่องได้หรือต้องคำนวณเอง (T6) (3) ต้นทุนการดาวน์โหลดตอนเลื่อน (ข้อ 9) ผู้ใช้ควรตัดสินใจ
- ไม่ทำในแผนนี้: เสียง, snap การเลื่อน, ทำเรื่องเล่าเป็นหลายโครงการ, งานเสริมประเภทห้อง
