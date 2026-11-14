# Plan 5 — ปรับหน้าตาทั้งเว็บให้ดูเป็นคอนโดหรู (luxury real estate)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เปลี่ยนหน้าตาทุกหน้า (หน้าแรก ค้นหา โครงการ รายละเอียดห้อง Navbar/Footer) ให้เป็นภาษาภาพเดียวกับ Explorer ของแผน 4: โทนหมึกเข้ม/งาช้าง + ทองแชมเปญ, หัวข้อ serif ไทย, เว้นที่ว่างมาก, ภาพใหญ่, เส้นขอบน้อย, การเคลื่อนไหวช้านุ่ม โดยไม่เปลี่ยนพฤติกรรม ข้อมูล หรือ API

**Architecture:** เปลี่ยนเฉพาะ `apps/web` (CSS/JSX/ภาพ) — ไม่แตะ API, D1, seed, `packages/shared`, workflow, ฉาก 3D (สีสถานะห้องคงเดิม) · ใช้ design token เป็นศูนย์กลาง: ค่าสีอยู่ที่ `@theme` ใน `index.css` (คงชื่อ `--color-accent` ไว้ คลาส `bg-accent`/`text-accent` ที่ใช้อยู่จึงเปลี่ยนสีตามโดยไม่ต้องไล่แก้ทีละไฟล์) แล้วมี test คอนทราสต์ตรวจ token คู่ต่อคู่ เหมือนที่ `glass.ts` ทำในแผน 4 · ภาพใหญ่ของโครงการหาได้จากชื่อไฟล์ตามธรรมเนียม (`<slug>.jpg` → `<slug>-hero.webp`) จึง**ไม่ต้องเพิ่มคอลัมน์หรือ seed ฐานข้อมูลจริงใหม่**

**Tech Stack:** React 19, Tailwind 4, Vitest, Playwright + axe (มีอยู่แล้ว) · ฟอนต์เพิ่ม 1 ตระกูลจาก Google Fonts (Noto Serif Thai) · **ไม่เพิ่ม dependency**

**Spec:** `docs/specs/2026-11-09-condoscope-design.md` ข้อ 8.1 (หน้าแรกต้องเป็นหน้าค้นหา), 5 (ภาพ AI + ป้ายกำกับ) · `CLAUDE.md` หัวข้อ "กฎที่ห้ามฝ่า" · `docs/plans/2026-11-11-plan-4-ux-ui.md` (Explorer, `glass.ts`)

**ก่อนเริ่ม:** แผน 4 (PR #4) ต้อง merge เข้า `main` ก่อน แล้วแตก `feat/plan-5` จาก `main` (แผนนี้แก้ `glass.ts`/`ExplorerPage` ที่แผน 4 เพิ่ม)

## Global Constraints

- งบ 0 บาท: ฟอนต์จาก Google Fonts (ฟรี, ใช้อยู่แล้ว), ภาพที่ผู้ใช้เจนเอง, ไม่เพิ่มบริการที่ผูกบัตร
- ห้ามใช้ชื่อ ภาพ หรือแปลนของโครงการจริง; ป้าย "ข้อมูลจำลอง" ต้องเห็นทุกหน้า (Navbar + Footer เดิม คงไว้)
- ภาพที่สร้างด้วย AI ต้องมีป้าย "ภาพประกอบสร้างด้วย AI" (`AiBadge`) — **ภาพโครงการชุดใหม่เป็น AI จึงต้องมีป้ายด้วย** (ปัจจุบัน `ai:false` ใน `ProjectPage.galleryOf`)
- หน้าแรกต้องเป็นหน้าค้นหา: Hero ใหม่ต้องมีช่องค้นหาที่ใช้ได้ทันทีโดยไม่ต้องเลื่อน (สเปกข้อ 8.1)
- UI ภาษาไทย สกุลเงิน THB; ห้ามมี secret ใน frontend
- คอนทราสต์ข้อความ ≥ 4.5:1 (ข้อความใหญ่ ≥ 3:1) ทุกคู่สีที่ใช้จริง ตรวจด้วย test ไม่ใช่ด้วยตา; **ห้ามใช้สีทองแชมเปญ `#C8A96B` เป็นสีตัวอักษรบนพื้นงาช้าง** (ได้แค่ 2.0:1) ใช้เป็นเส้น/พื้นปุ่มที่มีตัวอักษรหมึกเท่านั้น
- Bundle: หน้าแรก ≤ 130 KB gzip, 3D ≤ 600 KB, แผนที่ ≤ 323 KB (ตอนนี้ 97.3 / 293.5 / 284) — แผนนี้ตั้งเป้า entry ≤ 105 KB; ภาพและฟอนต์ไม่นับใน JS แต่มีงบน้ำหนักภาพแยก (Task 4)
- `prefers-reduced-motion`: ไม่มีอนิเมชันใดเล่นเลย (ไม่ใช่แค่ทำให้สั้นลง) และไม่มีอนิเมชันวนซ้ำ/เกิน 5 วินาที
- ไม่เปลี่ยนชื่อ accessible name / role / label ของสิ่งที่ e2e และ `HomePage.test.tsx` ใช้อยู่ (เปลี่ยนเฉพาะเลย์เอาต์และสี) · e2e ต้องผ่านครบเหมือนเดิม
- ห้ามแตะฐานข้อมูลจริงและ seed

## ภาพโครงการที่มี — พอไหม? **ไม่พอ**

| ชุดภาพ | ที่มี | ตัดสิน |
|---|---|---|
| ภายนอกโครงการ 5 ภาพ (`images/projects/*.jpg`) | 854×536 px ภาพ render จากโมเดล 3 มิติ ฉากพลบค่ำ ถนนและบล็อกเมืองเดียวกันทุกภาพ | **ไม่พอสำหรับ Hero เต็มจอ**: ความละเอียดต่ำ (เต็มจอ 1376 ต้องขยาย ~1.6 เท่า (ถ้า 1920 ~2.2 เท่า) จะเบลอ), สไตล์ low-poly ดู "เกม" มากกว่าหรู, ห้าโครงการหน้าตาเกือบเหมือนกัน, โครงการละภาพเดียว · **ใช้ต่อได้เป็นภาพเล็ก** (การ์ด และเป็นภาพ "จากโมเดล 3 มิติ" ในแกลเลอรี ซึ่งตรงกับสิ่งที่ผู้ใช้เห็นใน Explorer) |
| ภายในห้อง 17 ภาพ (`images/interiors/**`) | 1264×848 WebP โทนไม้โอ๊ก ผนังขาวอุ่น ทองเหลือง | **พอและเข้ากับทิศทางนี้** (โทนอุ่นเข้ากับงาช้าง/แชมเปญ) ใช้ที่ความกว้างแสดงผลไม่เกินราวครึ่งหน้าจอหรือไม่เกิน ~1264 px; ยังไม่ถึงระดับหรูสุด แต่ไม่ต้องเจนใหม่ |
| ภาพที่ขาด | — | (ก) ภาพ Hero หน้าแรก 1 ภาพ (ข) ภาพภายนอกใหม่ครบ 5 โครงการ · (ค, ไม่บังคับ) ภาพส่วนกลาง 3 ภาพสำหรับหน้าโครงการ: สระว่ายน้ำ ล็อบบี้ สวนลอยฟ้า |

**ข้อกำหนดภาพใหม่:** แนวนอน 16:9, ด้านยาว ≥ 2400 px (ส่งเป็น png/jpg แล้วให้ Claude แปลงเป็น WebP 1376 กับ 960 กว้าง), ไม่มีคน ตัวหนังสือ โลโก้ ลายน้ำ, ไม่มีสถานที่หรือสถานีรถไฟฟ้าที่ดูออกว่าเป็นของจริง, ใช้เครื่องมือเดียวกันและจบในแชทเดียว, ตรวจเงื่อนไขของเครื่องมือว่าให้เผยแพร่บนเว็บ portfolio ได้ (เหมือน `docs/image-prompts.md` ข้อ 6)

**ส่วนสไตล์กลาง (วางหน้าทุก prompt):**

```
Photorealistic architectural exterior photograph of a fictional luxury high-rise condominium in Bangkok, Thailand, shot at golden hour just after sunset with a deep blue and warm amber sky. Warm champagne-gold interior lights glowing in the windows, dark bronze and pale stone facade, refined landscaped podium with trees, calm and elegant mood, generous empty sky for text, wide 16:9 composition, shot from a low three-quarter angle with a 24mm tilt-shift lens, straight vertical lines, professional real-estate advertising photography, high detail. The building must be a wholly fictional design that does not resemble any existing building or real landmark. No logos, no signs, no signage, no lettering or text of any kind, no watermark, no people with clearly visible faces (none at all is preferred).
```

**เพิ่มตามผู้ใช้ (อนุมัติ 2026-11-11):** ตึกต้องเป็นดีไซน์สมมติ ไม่เหมือนตึกจริงหรือแลนด์มาร์ก; ไม่มีโลโก้ ป้าย ตัวหนังสือ หรือคนที่เห็นหน้าชัด — ประโยคนี้อยู่ในส่วนสไตล์กลางซึ่งวางหน้าทุก prompt แล้ว (รวมภาพ amenity ที่ต้องเติมประโยค "fictional design" เอง เพราะไม่มีตึกภายนอก ให้ใช้ `All architecture and interiors are fictional and do not resemble any real place.`)

| ไฟล์ (ใส่ใน `E:\project\condoscope-images\exterior\`) | prompt (ต่อท้ายส่วนสไตล์กลาง) |
|---|---|
| `home-hero` | `A sweeping view of a premium Bangkok skyline at dusk with one elegant tapered tower in the foreground, a river with soft reflections, tall sky occupying the upper half.` |
| `noventa-ari` | `Two slender towers of different heights rising from one shared podium with a rooftop sky garden and infinity pool, leafy low-rise neighbourhood around.` |
| `selvara-on-nut` | `A single slender tower with vertical fins and large balconies, a glowing swimming pool on the podium roof, a quiet tree-lined street below.` |
| `kaelo-khae-rai` | `Two mid-rise towers side by side connected by a landscaped courtyard, warm lights, suburban green surroundings and a distant highway bridge.` |
| `thalora-rangsit` | `A low-rise condominium of seven floors with long horizontal balconies, pale stone and timber details, a garden courtyard in the foreground, wide open sky.` |
| `marivo-paknam` | `A broad tower with wide corner units and wraparound balconies near a wide river mouth, boats and a hazy horizon in the distance.` |
| `amenity-pool`, `amenity-lobby`, `amenity-skygarden` (ไม่บังคับ) | `Interior or terrace photograph, no tower exterior:` ตามด้วย `an infinity pool terrace at dusk with loungers` / `a double-height hotel-style lobby with stone walls and brass details` / `a rooftop sky garden with timber decks and low lighting` |

หมายเหตุ: ตัวตึกในภาพไม่ต้องตรงกับโมเดล 3 มิติเป๊ะ แต่ให้จำนวนทาวเวอร์และสไตล์ใกล้เคียงกับ `packages/shared/src/projects.ts` เพื่อไม่ให้ผู้ใช้เห็นว่าหน้าโครงการกับ Explorer เป็นคนละตึก

## ตัดสินใจแทนผู้ใช้ — ขอให้ตรวจก่อนอนุมัติ

| # | เรื่อง | ที่เลือก | เหตุผล / ถ้าไม่เห็นด้วย |
|---|---|---|---|
| 1 | จานสี | **หมึก** `#14120F` · **งาช้าง** `#F6F2EA` (พื้นหน้า) · **หินอุ่น** `#5C554B` (ตัวอักษรรอง) · **บรอนซ์** `#7A5A22` (ตัวอักษร/ลิงก์ทองบนงาช้าง) · **แชมเปญ** `#C8A96B` (เส้นและพื้นปุ่ม) · **แชมเปญอ่อน** `#E2CC9A` (ตัวอักษรทองบนพื้นหมึก) · ตัวอักษรรองบนหมึก `#BDB5A6` | คอนทราสต์คำนวณแล้ว: หมึก/งาช้าง 16.8, หินอุ่น/งาช้าง 6.6, บรอนซ์/งาช้าง 5.7, แชมเปญ/หมึก 8.3, แชมเปญอ่อน/หมึก 11.9, `#BDB5A6`/หมึก 9.2 (Task 1 ตรวจซ้ำด้วย test) · **ถ้าอยากได้โทนเขียวเข้มหรือกรมท่าแทนหมึกอุ่น ให้บอก เปลี่ยนที่ token ที่เดียว** |
| 2 | ฟอนต์ | หัวข้อ/ราคา/ชื่อโครงการ: **Noto Serif Thai** (น้ำหนัก 400, 600) · เนื้อหา: IBM Plex Sans Thai เดิม · serif ใช้เฉพาะข้อความ ≥ 20 px | Noto Serif Thai มีอักษรไทยและละติน serif ในไฟล์เดียว จึงไม่ต้องคู่ฟอนต์ละตินเพิ่ม; ตัวเล็กของ serif ไทยอ่านยาก จึงไม่ใช้กับเนื้อหา · ความเสี่ยง: โหลดจาก Google Fonts เพิ่ม 1 request (`display=swap` ไม่บล็อกการแสดงผล) |
| 3 | Navbar | **แถบหมึกทึบทุกหน้า** (ตัวอักษรงาช้าง, โลโก้ serif, ป้าย "ข้อมูลจำลอง" สีแชมเปญอ่อนบนหมึก) ไม่โปร่งซ้อนบน Hero | กลมกลืนกับแผง dark glass ของ Explorer และไม่ต้องจัดการคอนทราสต์ที่เปลี่ยนไปตามภาพ; ทางเลือก: โปร่งซ้อน Hero เฉพาะหน้าแรก (ซับซ้อนกว่า เสี่ยง axe และมือถือ) |
| 4 | Hero หน้าแรก | สูง `100svh − Navbar` (ขั้นต่ำ 560 px), ภาพโครงการแนะนำเต็มกว้าง + scrim ไล่เฉดดำ, หัวข้อ serif ใหญ่ซ้ายล่าง, **ช่องค้นหาเป็นแถบเดียวลอยบนภาพ** (ชื่อ/ทำเล + จังหวัด + ราคาสูงสุด + ห้องนอน + ปุ่ม) ส่วน "เขต" และ "ราคาต่ำสุด" อยู่ใน `<details>` "ตัวกรองเพิ่มเติม" เปิดแล้วได้ฟิลด์ครบเท่าเดิม | ฟิลด์ทั้งหมดและ label เดิมยังอยู่ (test/e2e เดิมใช้ได้) แต่แถบสั้นลงให้ดู "ภาพใหญ่" · มือถือ: ฟิลด์เรียงแนวตั้ง ปุ่มเต็มกว้าง |
| 5 | การ์ดและเส้นขอบ | ลบกรอบการ์ด (`border`) ใช้ภาพใหญ่ + ข้อความบนพื้นเดิม คั่นด้วยเส้นแชมเปญ 1 px บางจุด; การ์ดยังเป็นลิงก์เดียวต่อใบ (`after:absolute after:inset-0`) | ตรงกับ "การ์ดและเส้นขอบน้อย"; ต้องเก็บ affordance ว่าคลิกได้ (ชื่อขีดเส้นใต้เมื่อ hover/focus + วงโฟกัส) เพราะไม่มีกรอบ/ปุ่มบอก |
| 6 | การเคลื่อนไหว | (ก) เนื้อหาเลื่อนขึ้นและจางเข้า 700 ms ease-out ครั้งเดียวเมื่อเข้าจอ (`useReveal` ด้วย IntersectionObserver ~15 บรรทัด) (ข) ภาพ Hero ค่อยๆ ซูมเข้า 1.06→1 ครั้งเดียว ≤ 5 วินาที (ไม่วนซ้ำ) (ค) hover ภาพการ์ดซูม 1.03 ใน 700 ms | ไม่มีอนิเมชันวน → ไม่ติดเกณฑ์ WCAG 2.2.2; ถ้าเปิดลดการเคลื่อนไหว เนื้อหาแสดงทันทีและไม่ซูม; ถ้าเบราว์เซอร์ไม่มี IntersectionObserver เนื้อหาต้องแสดงเลย (ไม่ซ่อนถาวร) |
| 7 | Explorer | เปลี่ยนเฉพาะ token: พื้นแผง slate-900 → หมึกอุ่น `#14120F` ความทึบ 82% เท่าเดิม, ปุ่ม/แท็บที่เลือกเป็นแชมเปญพื้น + ตัวอักษรหมึก (แทนน้ำเงิน), ลิงก์ในแผงเป็นแชมเปญอ่อน, ชื่อโครงการในแผงเป็น serif; **สีสถานะห้อง (ว่าง/จอง/ขาย) และฉาก 3 มิติไม่เปลี่ยน** เพราะเป็นความหมาย ไม่ใช่การตกแต่ง | ทำให้ Explorer เข้ากับหน้าอื่นโดยไม่เสี่ยงทำให้สีสถานะแยกกันยาก |
| 8 | ภาพโครงการใหม่ | ผู้ใช้เจนเอง ตาม prompt ด้านบน; โค้ดทำงานได้ทันทีด้วยภาพเก่า (ถ้า `-hero.webp` ไม่มี → ใช้ `thumbnail_url` เดิมแทนด้วย `onError`) แล้วค่อยเปลี่ยนเป็นภาพใหม่เมื่อวางไฟล์ | ไม่ให้ทั้งแผนรอผู้ใช้เจนภาพ; แต่ภาพ Hero เก่าจะดูเบลอและไม่หรู **จึงยังไม่ถือว่าแผนนี้เสร็จจนกว่าภาพใหม่จะมา** (Task 10 ตรวจ) |
| 9 | หน้าโครงการ | ภาพแรกเต็มกว้างสูง ~70svh (ชื่อ serif ซ้อนล่างซ้ายบน scrim) แล้วเนื้อหา 2 คอลัมน์: ซ้ายคำอธิบาย/ห้องว่าง/สิ่งอำนวยความสะดวก ขวาเป็นการ์ดราคา + ปุ่ม "เลือกห้องจากตัวอาคาร" ที่ sticky บน desktop; แกลเลอรีเดิมย้ายลงใต้ Hero | ปุ่มเข้า Explorer ต้องเห็นโดยไม่เลื่อนไกลบนมือถือ (ย้ายขึ้นใต้ชื่อ) |
| 10 | งานเสริมประเภทห้องใหม่ | **ไม่อยู่ในแผนนี้** (ผู้ใช้ยังไม่อนุญาต) | — |

## ไฟล์ที่เกี่ยวข้อง (แผนที่การแก้)

- แก้: `apps/web/index.html` (ลิงก์ฟอนต์), `src/index.css` (`@theme`, `.glass`, คลาสอนิเมชัน), `src/components/{Navbar,Footer,ProjectCard,Layout,glass,OverlayPanel,AiBadge}.tsx|ts`, `src/features/home/{Hero,HomePage}.tsx`, `src/features/search/{SearchPage,FiltersPanel}.tsx`, `src/features/project/{ProjectPage,Gallery}.tsx`, `src/features/unit/{UnitPage,FloorPlanSvg,ImageViewer}.tsx`, `src/features/explorer/{ExplorerPage,ExplorerTabs,BottomSheet,Legend}.tsx` (เฉพาะคลาสสี/ฟอนต์), `src/lib/contrast.test.ts`
- สร้าง: `src/components/theme.ts` (token สีของเว็บ + `PAIRS` ที่ต้องผ่านคอนทราสต์), `src/hooks/useReveal.ts`, `src/components/HeroImage.tsx` (รูป Hero + fallback), `docs/image-prompts-exterior.md` (prompt ด้านบนแยกเป็นไฟล์), `public/images/projects/*-hero.webp` (+ `-hero-sm.webp` 960 กว้าง) เมื่อผู้ใช้ส่งภาพ
- ไม่แตะ: `apps/api`, `packages/shared`, `database/`, `.github/`, `scene/*` (ฉาก 3 มิติ), `docs/qa-ba/`

## Review Focus

1. **ฟอนต์ serif โหลดไม่ได้/ช้า** (Google Fonts ถูกบล็อกหรือเน็ตช้า): หัวข้อต้องตกไป serif ของระบบที่รองรับไทยและไม่ล้นกรอบ ไม่มีหน้าว่างระหว่างรอ (Task 1: ตั้ง `font-display: swap` และ fallback stack; Task 4: หัวข้อ Hero ไม่เปลี่ยนความสูงจนช่องค้นหาเลื่อนหลุดจอ)
2. **ภาพ Hero ไม่โหลด / ภาพเก่าความละเอียดต่ำ:** Hero ต้องยังอ่านได้และใช้งานช่องค้นหาได้ (พื้นหมึกคือสีสำรอง) ไม่มีไอคอนรูปแตก (Task 4)
3. **ตัวอักษรบนภาพ:** ภาพจะสว่างหรือมืดแค่ไหนก็ตาม ต้องผ่าน 4.5:1 → test คอนทราสต์กับ scrim ในกรณีแย่สุด (ภาพขาวสนิทหลัง scrim) ไม่ใช่ดูจากภาพตัวอย่าง (Task 4)
4. **จอแคบ 320–390 px และการขยายตัวอักษร 200%:** หัวข้อ serif ใหญ่, แถบค้นหา, ราคาในหน้าห้อง ต้องไม่ล้นหรือทับกัน และไม่มีเลื่อนแนวนอน (Task 4, 6, 7 ใช้ viewport 320 กับ 390 ใน e2e)
5. **ผู้ใช้เปิดลดการเคลื่อนไหว หรือเบราว์เซอร์ไม่มี IntersectionObserver:** เนื้อหาต้องไม่ถูกซ่อนค้างที่ opacity 0 (Task 3)

---

### Task 1: Token สีและฟอนต์ + test คอนทราสต์

**Files:**
- Create: `apps/web/src/components/theme.ts`, `apps/web/src/components/theme.test.ts`
- Modify: `apps/web/src/index.css` (`@theme`, `body`), `apps/web/index.html`

**Interfaces:**
- Produces: `THEME: { ink, ivory, stone, bronze, champagne, champagneSoft, inkMuted }` (hex string) และ `PAIRS: { name: string; fg: string; bg: string; min: number }[]` ใน `theme.ts`; CSS variables `--color-ink`, `--color-ivory`, `--color-stone`, `--color-bronze`, `--color-champagne`, `--color-champagne-soft`; `--font-serif`; `--color-accent` = หมึก, `--color-accent-hover` = `#2B2620`
- Consumes: `contrastRatio` จาก `lib/contrast.ts`

- [ ] **Step 1: เขียน test ที่ล้ม** `theme.test.ts`: (ก) ทุก `PAIRS` ผ่าน `contrastRatio(fg,bg) >= min` (ข้อความ min 4.5; คู่แชมเปญ/หมึก min 4.5; **มีคู่ที่ห้ามใช้:** `assert contrastRatio(champagne, ivory) < 3` เพื่อกันคนเผลอใช้เป็นตัวอักษร) (ข) อ่าน `index.css` ด้วย `fs` แล้วยืนยันว่าทุกค่าใน `THEME` ปรากฏเป็น `--color-*` ตรงกัน (เหมือนที่ `contrast.test.ts` ทำกับ `GLASS`)
- [ ] **Step 2: รัน** `npm test -w web -- theme` — Expected: FAIL (ยังไม่มีไฟล์)
- [ ] **Step 3: สร้าง `theme.ts` และแก้ `@theme` ใน `index.css`**: ค่าตามตารางข้อ 1; `--font-serif: 'Noto Serif Thai', 'Noto Serif', Georgia, 'Times New Roman', serif`; `body` พื้นงาช้างตัวอักษรหมึก; ลิงก์ในเนื้อหาใช้บรอนซ์ + ขีดเส้นใต้ · แก้ `index.html` ให้ลิงก์ Google Fonts เพิ่ม `family=Noto+Serif+Thai:wght@400;600` (`display=swap`)
- [ ] **Step 4: ไล่หาสีที่ฝังตายตัว** ด้วย `grep -rn "blue-\|sky-\|#2563eb\|slate-" apps/web/src` นอก `features/explorer/scene` และ `glass`; จดรายการ (ไม่แก้ในงานนี้ ให้ Task ของหน้านั้นแก้) ลงใน ledger
- [ ] **Step 5: รัน** `npm test -w web -- theme`, `npm run typecheck`, `npm test -w web` — Expected: ผ่านทั้งหมด (ถ้า test เดิมล้มเพราะสีเปลี่ยน ให้แก้ test ที่เช็กคลาสสีเท่านั้น)
- [ ] **Step 6: Commit** `feat(web): luxury colour tokens, serif font, contrast test`

### Task 2: Navbar, Footer, Layout

**Files:** Modify `components/Navbar.tsx`, `components/Footer.tsx`, `components/Layout.tsx` · Test: `components/Layout.test.tsx` (เดิม), ใหม่ `components/Navbar.test.tsx` ถ้ายังไม่มี

**Interfaces:** Consumes: token Task 1 · Produces: ไม่มี API ใหม่ (รูป DOM/ role/ label เดิมคงเดิม)

- [ ] **Step 1: test ที่ล้ม** — `Navbar.test.tsx`: ลิงก์ "ค้นหาคอนโด" และ "แผนที่" ยังอยู่ใน `nav[aria-label="เมนูหลัก"]`; ป้าย "ข้อมูลจำลอง" ยังอยู่; ปุ่มเมนูมือถือ `aria-expanded` สลับถูก; โลโก้มีคลาส `font-serif` (ยืนยันว่าเปลี่ยนจริง) · `Footer`: ข้อความข้อมูลจำลองครบ 3 ประโยคเดิม
- [ ] **Step 2: รันให้ล้ม** `npm test -w web -- Navbar Footer`
- [ ] **Step 3: แก้ Navbar** เป็นแถบ `bg-ink` ตัวอักษรงาช้าง ลิงก์ที่ active ขีดเส้นใต้แชมเปญ (ไม่พึ่งสีอย่างเดียว) โลโก้ serif ไม่มีไอคอน `Building2` สีน้ำเงิน; ป้ายข้อมูลจำลอง: พื้นโปร่งขอบแชมเปญตัวอักษรแชมเปญอ่อน · Footer: พื้นหมึก ตัวอักษร `#BDB5A6` (≥ 4.5 ตาม test) เว้นที่ว่างมากขึ้น เนื้อหาเดิมครบ · `Layout`: ไม่เปลี่ยนตรรกะ `100dvh` ของ `/explorer/…`
- [ ] **Step 4: รัน** test ข้างต้นและ `npm test -w web` — Expected: ผ่าน
- [ ] **Step 5: Commit** `feat(web): dark ink navbar and footer`

### Task 3: การเคลื่อนไหวนุ่ม (`useReveal`)

**Files:** Create `hooks/useReveal.ts`, `hooks/useReveal.test.tsx` · Modify `index.css`

**Interfaces:** Produces: `useReveal<T extends HTMLElement>(): React.RefObject<T>` — เมื่อองค์ประกอบเข้าจอครั้งแรก ใส่ `data-revealed="true"`; ปลดการสังเกตหลังครั้งแรก · CSS: `.reveal` เริ่ม `opacity:0; translate:0 16px` เปลี่ยนเป็นปกติเมื่อ `[data-revealed]` ด้วย `transition 700ms ease-out`

- [ ] **Step 1: test ที่ล้ม** (jsdom, mock `IntersectionObserver`): (ก) ยังไม่ตัด intersect → ไม่มี `data-revealed` (ข) intersect → มี และเรียก `disconnect` (ค) **ไม่มี `IntersectionObserver` (ลบ global) → ตั้ง `data-revealed` ทันที** (ง) `matchMedia('(prefers-reduced-motion: reduce)')` เป็นจริง → ตั้งทันทีโดยไม่สร้าง observer
- [ ] **Step 2: รันให้ล้ม** `npm test -w web -- useReveal`
- [ ] **Step 3: เขียน hook** ตาม Interfaces; ใน CSS ให้ `.reveal` มีผลเฉพาะใน `@media (prefers-reduced-motion: no-preference)` เพื่อกันกรณี JS ไม่ทำงาน/ลดการเคลื่อนไหวแล้วเนื้อหาโปร่งใสค้าง; เพิ่ม `.hero-settle` (ซูม 1.06→1 ครั้งเดียว 5s ease-out, เฉพาะ no-preference)
- [ ] **Step 4: รัน** `npm test -w web -- useReveal` — Expected: ผ่าน
- [ ] **Step 5: Commit** `feat(web): slow one-shot reveal, respects reduced motion`

### Task 4: Hero หน้าแรก

**Files:** Create `components/HeroImage.tsx`, `components/HeroImage.test.tsx` · Modify `features/home/Hero.tsx`, `features/home/HomePage.tsx`, `features/home/HomePage.test.tsx` · เพิ่มไฟล์ภาพ (Task 10)

**Interfaces:**
- Produces: `heroSrc(thumbnailUrl: string): { src: string; srcSm: string }` — แทน `.jpg` ด้วย `-hero.webp` และ `-hero-sm.webp`; `<HeroImage project={Project} priority? />` แสดง `<img>` (`alt=""` ถ้าตกแต่ง, `srcset` 960w/1376w, `fetchpriority="high"` เมื่อ `priority`) พร้อม `AiBadge` เมื่อเป็นภาพ AI; `onError` ครั้งแรกสลับไป `thumbnail_url`, ครั้งที่สองซ่อนรูป (พื้นหมึกเป็นสีสำรอง)
- Consumes: `useReveal` (Task 3), `THEME` (Task 1)

- [ ] **Step 1: test ที่ล้ม** — `heroSrc('images/projects/noventa-ari.jpg')` ได้ `images/projects/noventa-ari-hero.webp` และ `-hero-sm.webp`; `HeroImage` เมื่อ `error` ครั้งแรกใช้ thumbnail, ครั้งที่สองไม่มี `<img>` แตกค้าง; `HomePage.test`: ช่อง "ชื่อโครงการหรือทำเล" ยังอยู่และส่งแบบฟอร์มได้, `<details>` "ตัวกรองเพิ่มเติม" ปิดอยู่ตอนเริ่มและเมื่อเปิดมี "เขต" กับ "ราคาต่ำสุด", ส่งฟิลด์ที่ซ่อนอยู่แล้วค่าเข้า URL ถูก (**ฟิลด์ใน `<details>` ปิดต้องยังถูกส่ง**) · test คอนทราสต์: คู่ ตัวอักษรขาว/scrim ที่ความทึบต่ำสุดของ gradient บนพื้นขาวสนิท (ใช้ `compositeOver`) ≥ 4.5 → เพิ่มเป็น `PAIRS` ใน `theme.ts`
- [ ] **Step 2: รันให้ล้ม** `npm test -w web -- HeroImage HomePage theme`
- [ ] **Step 3: เขียน `HeroImage` และจัด `Hero`** ตามข้อ 4 ของตาราง: `min-h` = `max(560px, 100svh − 3.5rem)`; หัวข้อ `font-serif` ขนาดใช้ `clamp()` ไม่เกิน 4.5rem; scrim ไล่เฉด `from-black/70 via-black/35`; แถบค้นหาพื้นงาช้างโปร่งน้อย ฟิลด์เดิมทั้งหมด; ไม่ใช้ `loading="lazy"` กับรูป Hero · ส่วนอื่นของ `HomePage` (ทำเลยอดนิยมเป็นข้อความลิงก์ไม่ใช่ pill, โครงการแนะนำ/ทั้งหมดในกริดห่างขึ้น, ส่วนแผนที่ลดกรอบ) ใช้ `useReveal`
- [ ] **Step 4: ตรวจน้ำหนัก** ภาพ Hero แต่ละภาพ ≤ 250 KB (1376 กว้าง ขนาดเดิมของภาพที่ผู้ใช้ส่ง ห้ามขยาย) และ ≤ 90 KB (960 กว้าง) — ถ้าเกินให้ลดคุณภาพ WebP
- [ ] **Step 5: รัน** `npm test -w web`, `npm run build -w web && npm run check:bundles -w web` — Expected: ผ่าน, entry ≤ 105 KB gzip (ถ้าเกินให้หาสาเหตุก่อน ไม่ขยายเพดาน)
- [ ] **Step 6: e2e** เพิ่มใน `e2e/journeys.spec.ts`: หน้าแรกที่ viewport 390×844 และ 320×640 → ช่องค้นหาและปุ่มค้นหาอยู่ในจอโดยไม่เลื่อน, `scrollWidth <= clientWidth`; บล็อกคำขอ `*-hero*.webp` ด้วย `route.abort()` แล้วช่องค้นหายังใช้ได้และไม่มีรูปแตก
- [ ] **Step 7: Commit** `feat(web): full-screen hero with floating search`

### Task 5: การ์ดโครงการ และหน้าค้นหา

**Files:** Modify `components/ProjectCard.tsx`, `features/search/{SearchPage,FiltersPanel}.tsx` + test ของไฟล์เหล่านั้น

**Interfaces:** Consumes: `useReveal`, token · `ProjectCard` props เดิม (`project: Project`) ไม่เปลี่ยน

- [ ] **Step 1: test ที่ล้ม** — `ProjectCard`: ยังมีลิงก์เดียวชื่อ "ดูรายละเอียด" ไปที่ `/project/:id`; ชื่อโครงการ `font-serif`; ไม่มีคลาส `border` บน `<article>`; แสดง `AiBadge` ถ้าเป็นภาพ AI (ภาพ `thumbnail_url` เดิมเป็นภาพ 3 มิติ ไม่ใช่ AI → ไม่มีป้าย)
- [ ] **Step 2: รันให้ล้ม** `npm test -w web -- ProjectCard`
- [ ] **Step 3: แก้การ์ด** ภาพ `aspect-[4/3]` ซูมช้า 1.03 เมื่อ hover/focus-within (เฉพาะ motion-safe), ข้อความ serif ชื่อ + ราคาเป็นตัวหนาบรอนซ์ ลิงก์ "ดูรายละเอียด" เป็นข้อความขีดเส้นใต้แทนปุ่มสีน้ำเงิน (ยังคลุมทั้งการ์ดด้วย pseudo-element และมีวงโฟกัสเห็นชัด) · `SearchPage`: หัวข้อ serif, `FiltersPanel` เป็นแผงเรียบไม่มีกรอบ (เส้นแชมเปญด้านบน), ผลลัพธ์กริด 2 คอลัมน์ ช่องไฟกว้าง; ข้อความ "ไม่พบข้อมูล"/โหลด ใช้โทนใหม่
- [ ] **Step 4: รัน** `npm test -w web` — Expected: ผ่าน
- [ ] **Step 5: Commit** `feat(web): borderless project cards and calmer search page`

### Task 6: หน้าโครงการ

**Files:** Modify `features/project/{ProjectPage,Gallery,Availability}.tsx` + test เดิม

**Interfaces:** Consumes: `HeroImage`, `heroSrc` (Task 4), `useReveal` · Produces: `galleryOf` ใส่ภาพ Hero ใหม่ (ถ้ามี) เป็น `ai:true` และคงภาพ 3 มิติเดิมเป็นรายการ "ภาพจากโมเดล 3 มิติ" (`ai:false`)

- [ ] **Step 1: test ที่ล้ม** — ปุ่ม/ลิงก์ "เลือกห้องจากตัวอาคาร" ไปที่ `/explorer/:id` ยังอยู่ และปรากฏก่อนหัวข้อ "เกี่ยวกับโครงการ" ใน DOM; ภาพ Hero มีป้าย AI เมื่อใช้ภาพใหม่ และไม่มีเมื่อ fallback เป็นภาพ 3 มิติ; ลิงก์ "กลับไปผลการค้นหา" ยังอยู่
- [ ] **Step 2: รันให้ล้ม** `npm test -w web -- ProjectPage`
- [ ] **Step 3: จัดหน้า** ตามข้อ 9: Hero เต็มกว้าง `min-h-[60svh]` ชื่อ serif บน scrim, การ์ดราคา sticky (`lg:sticky lg:top-6`), ตาราง "ห้องว่าง" ใช้เส้นคั่นบางแทนกรอบ, รายการสิ่งอำนวยความสะดวกไอคอนสีบรอนซ์ในกริดโปร่ง
- [ ] **Step 4: รัน** `npm test -w web` — Expected: ผ่าน
- [ ] **Step 5: e2e** viewport 320 และ 390: ปุ่มเข้า Explorer อยู่ในจอแรกหรือเลื่อนไม่เกิน 1 หน้าจอ และไม่มีเลื่อนแนวนอน
- [ ] **Step 6: Commit** `feat(web): immersive project page`

### Task 7: หน้ารายละเอียดห้อง

**Files:** Modify `features/unit/{UnitPage,FloorPlanSvg,ImageViewer}.tsx` + test เดิม

- [ ] **Step 1: test ที่ล้ม** — ราคาในหัวข้อเป็น serif; `<dl>` ข้อมูลห้องไม่มีกรอบ (`border`) แต่ละรายการคั่นเส้นบาง; ข้อความ "แปลนจำลองตามประเภทห้อง ไม่ใช่แปลนของโครงการจริง" และป้าย AI บนภาพภายในยังอยู่; จุด hotspot ใน `FloorPlanSvg` ยังกดด้วยคีย์บอร์ดได้ (ข้อ test เดิมต้องผ่าน)
- [ ] **Step 2: รันให้ล้ม** `npm test -w web -- UnitPage FloorPlanSvg`
- [ ] **Step 3: แก้** ชื่อห้อง/ราคา serif ใหญ่, สถานะแสดงจุดสีเดิม (สีสถานะคงเดิม) + ข้อความ, แปลนใช้เส้นหมึกบางบนพื้นงาช้างเข้มกว่าเล็กน้อย, hotspot ที่เลือกเป็นแชมเปญพื้นตัวหมึก, ภาพภายในใหญ่ขึ้นเต็มคอลัมน์ (ไม่เกิน 1264 px) มุมไม่โค้งมาก
- [ ] **Step 4: รัน** `npm test -w web` — Expected: ผ่าน (ตรวจคอนทราสต์ของสีแปลนด้วย `PAIRS`)
- [ ] **Step 5: Commit** `feat(web): quieter unit page with larger imagery`

### Task 8: ทำให้ Explorer เข้ากับหน้าอื่น

**Files:** Modify `components/glass.ts`, `index.css` (`.glass*`), `lib/contrast.test.ts`, `components/OverlayPanel.tsx`, `features/explorer/{ExplorerPage,ExplorerTabs,BottomSheet,Legend}.tsx` (คลาสสี/ฟอนต์ เท่านั้น)

**Interfaces:** `GLASS` คงชื่อฟิลด์เดิมทั้งหมด เปลี่ยนเฉพาะค่า (พื้น `#14120F`, ตัวอักษร `#F6F2EA`, รอง `#BDB5A6`, ลิงก์ `#E2CC9A`, accent พื้น `#C8A96B` ตัวอักษร `#14120F`) — ไฟล์อื่นที่ import `GLASS` จึงไม่ต้องแก้

- [ ] **Step 1: แก้ test ให้สะท้อนค่าใหม่ก่อน** (`contrast.test.ts`: ค่า token ตรงกับ `index.css`, คอนทราสต์ ≥ 4.5 กับฉากหลังดำสนิทและขาวสนิทในกรณีแย่สุด) แล้วรันให้ล้ม `npm test -w web -- contrast`
- [ ] **Step 2: แก้ `glass.ts` และ `.glass*` ใน `index.css`**; ชื่อโครงการในแผงซ้ายเป็น `font-serif`; แท็บ/ปุ่มที่ถูกเลือกใช้ `glass-accent` ใหม่ (ไม่ใช้สีน้ำเงิน); วงโฟกัสในแผงเป็นแชมเปญอ่อน (มองเห็นบนพื้นหมึก)
- [ ] **Step 3: ยืนยันสีสถานะห้องไม่ถูกแตะ** — test: `Legend` ยังใช้ `STATUS_STYLE` เดิมและสี 3 สถานะต่างกันพอ (ใช้ `contrastRatio` ระหว่างคู่สถานะบนพื้นแผง ≥ 3:1 สำหรับ non-text)
- [ ] **Step 4: รัน** `npm test -w web`, e2e ไฟล์ `explorer*.spec.ts` (ใช้ `--reporter=list`, ระบุไฟล์ ไม่ใช้ `-g` ผ่าน npm) — Expected: ผ่านทั้งหมด รวม axe 4 สถานะของ Explorer
- [ ] **Step 5: Commit** `feat(web): explorer panels adopt the luxury palette`

### Task 9: ตรวจทั้งเว็บ ภาพหน้าจอ และเอกสาร

**Files:** Modify `README.md`, `docs/architecture.md`, `docs/screenshots/*`, `CLAUDE.md`, `docs/image-prompts-exterior.md` (สร้าง), `apps/web/e2e/*` ที่ต้องปรับ locator

- [ ] **Step 1: ตรวจเต็มชุด** `npm run typecheck`; `npm test`; `npm run build -w web && npm run check:bundles -w web` (entry ≤ 105 KB เป้า, ≤ 130 เพดาน); `npm run e2e` (รอบเต็ม ใช้ `--reporter=list`) — Expected: ผ่านหมด ถ้าล้มให้รายงานสาเหตุจริง ไม่แก้ test ให้ผ่านด้วยการลดเกณฑ์
- [ ] **Step 2: axe 6 หน้า + Explorer** ผ่านเท่าเดิมหรือดีกว่า (ถ้า axe เจอปัญหาใหม่ให้แก้ที่ต้นเหตุ)
- [ ] **Step 3: ถ่ายภาพหน้าจอใหม่** `npm run screenshots` แล้ว**ดูภาพจริงเองที่ 1400×900, 1024×700, 390×844** ทุกหน้า (ตรวจ: หัวข้อ serif ไม่ล้น, scrim อ่านได้, ไม่มีเลื่อนแนวนอน, ขอบการ์ดที่หายไปยังรู้ว่าคลิกได้)
- [ ] **Step 4: เอกสาร** README (ฟีเจอร์/ภาพหน้าจอ), `docs/architecture.md` (หัวข้อ "ภาษาภาพ": token, ฟอนต์, กติกาภาพ Hero ตามชื่อไฟล์, กติกาห้ามแชมเปญเป็นตัวอักษรบนงาช้าง), `CLAUDE.md` (สถานะแผน 5 + ภาพที่ยังรอผู้ใช้), `docs/image-prompts-exterior.md`
- [ ] **Step 5: รายการ test case QA/BA ที่อาจล้าสมัย (ไม่แก้ให้)** แจ้งผู้ใช้: ทุกข้อที่อ้างลำดับ/ข้อความบนหน้าแรก (Hero เปลี่ยน, ฟิลด์ "เขต/ราคาต่ำสุด" ซ่อนใน "ตัวกรองเพิ่มเติม"), หน้าค้นหา/การ์ด, หน้าโครงการ (ลำดับองค์ประกอบ), contrast, `user-flow.md` และภาพหน้าจอในเอกสาร
- [ ] **Step 6: Commit** `docs: plan 5 status, architecture and screenshots`

### Task 10 (🧑 ผู้ใช้): ภาพใหม่

- [ ] ผู้ใช้เจนภาพตาม prompt ข้างต้น วางที่ `E:\project\condoscope-images\exterior\`
- [ ] Claude แปลงเป็น `apps/web/public/images/projects/<slug>-hero.webp` (1376 กว้าง ขนาดเดิมของภาพที่ผู้ใช้ส่ง ห้ามขยาย) และ `-hero-sm.webp` (960 กว้าง) และ `home-hero.*` ด้วยเครื่องมือครั้งเดียว (ไม่เพิ่ม dependency) ตรวจน้ำหนัก ดูภาพทุกภาพว่าไม่มีคน/ตัวหนังสือ/ลายน้ำ แล้ว commit `feat(web): luxury exterior imagery`
- [ ] ถ่ายภาพหน้าจอใหม่ (Task 9 Step 3) อีกรอบ — **แผนนี้ถือว่าเสร็จเมื่อขั้นนี้ผ่านเท่านั้น**

## Self-review (ตรวจเทียบคำสั่งแล้ว)

- ครอบคลุมคำสั่ง: หน้าแรก (T4), ค้นหา (T5), โครงการ (T6), รายละเอียดห้อง (T7), Navbar/Footer (T2), Explorer เข้ากับหน้าอื่น (T8), ฟอนต์ serif ไทย (T1), สีหมึก/งาช้าง/แชมเปญ (T1), เว้นที่ว่าง/ภาพใหญ่/ขอบน้อย (T4–7), การเคลื่อนไหวช้าและเคารพลดการเคลื่อนไหว (T3), Hero เต็มจอ + ช่องค้นหาลอย (T4), คอนทราสต์ (T1, T4, T8, Review Focus 3), bundle (T4, T9), ภาพ + prompt (ส่วน "ภาพโครงการที่มี", T10)
- ชื่อที่ใช้ข้าม task ตรงกัน: `THEME`/`PAIRS` (T1→T4, T7), `useReveal` (T3→T4–6), `heroSrc`/`HeroImage` (T4→T6)
- สิ่งที่แผนนี้**ไม่**ทำ: เปลี่ยนสีฉาก 3 มิติ, เปลี่ยนโมเดลข้อมูล/seed, หน้าแผนที่ (แค่รับ token ใหม่ผ่านคลาสที่มีอยู่ ตรวจใน T9 ว่ายังอ่านได้), ธีมสว่าง/มืดสลับได้, งานเสริมประเภทห้อง
