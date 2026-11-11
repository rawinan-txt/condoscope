# Prompt ภาพภายนอกโครงการและภาพ Hero (AI) — แผน 5

ภาพชุดนี้ใช้เป็น Hero หน้าแรกและหน้าโครงการ แปลงเป็น `apps/web/public/images/projects/<slug>-hero.webp` (+ `-hero-sm.webp`) ที่มา: `docs/plans/2026-11-11-plan-5-luxury-look.md`

**ข้อกำหนดภาพใหม่:** แนวนอน 16:9, ด้านยาว ≥ 2400 px (ส่งเป็น png/jpg แล้วให้ Claude แปลงเป็น WebP 1920 กับ 960 กว้าง), ไม่มีคน ตัวหนังสือ โลโก้ ลายน้ำ, ไม่มีสถานที่หรือสถานีรถไฟฟ้าที่ดูออกว่าเป็นของจริง, ใช้เครื่องมือเดียวกันและจบในแชทเดียว, ตรวจเงื่อนไขของเครื่องมือว่าให้เผยแพร่บนเว็บ portfolio ได้ (เหมือน `docs/image-prompts.md` ข้อ 6)

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

หมายเหตุ: ตัวตึกไม่ต้องตรงกับโมเดล 3 มิติเป๊ะ แต่จำนวนทาวเวอร์และสไตล์ควรใกล้เคียง `packages/shared/src/projects.ts`
