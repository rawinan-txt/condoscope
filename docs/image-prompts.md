# Prompt สำหรับภาพภายในห้อง (AI) — 17 ภาพ

ภาพชุดนี้ใช้ในหน้า Unit Detail ตอนคลิก hotspot บน Floor plan ภาพหนึ่งชุดใช้ร่วมกันกับทุกห้องที่เป็นประเภทเดียวกัน

## วิธีทำ
1. ใช้**เครื่องมือเดียวกันทั้ง 17 ภาพ** (เช่น Gemini, ChatGPT หรือ Microsoft Designer) และทำให้จบในแชทเดียว ภาพจะได้ออกมาแนวเดียวกัน
2. ทุกภาพให้ copy **"ส่วนสไตล์กลาง"** ไปวางก่อน แล้วต่อด้วย prompt ของห้องนั้น
3. เลือกภาพแนวนอน (สัดส่วน 3:2 หรือ 16:9)
4. บันทึกภาพตามชื่อไฟล์ในตาราง ส่งเป็น .png หรือ .jpg ก็ได้ Claude จะแปลงเป็น `.webp` แล้วย้ายไปไว้ที่ `apps/web/public/images/interiors/` ให้
5. ตรวจทุกภาพว่าไม่มีคน ไม่มีตัวหนังสือ โลโก้ หรือลายน้ำ และวิวนอกหน้าต่างไม่ใช่ตึกที่ดูออกว่าเป็นตึกจริงตึกไหน
6. ตรวจเงื่อนไขของเครื่องมือที่ใช้ว่าอนุญาตให้นำภาพไปเผยแพร่บนเว็บ portfolio ได้

---

## ส่วนสไตล์กลาง (วางไว้หน้าทุก prompt)

```
Photorealistic real-estate interior photograph of a newly finished modern condominium unit in a high-rise in Bangkok, Thailand. Consistent design language: light natural oak wood floor, warm white walls, light greige fabrics, matte black window frames, brushed brass accents, built-in light oak cabinetry with white quartz countertops, sheer white curtains. Soft natural daylight from floor-to-ceiling windows, gentle warm interior lighting, clean and tidy, staged for sale. Shot at eye level with a 20mm wide-angle lens, straight vertical lines, professional architectural photography, high detail. No people, no text, no logos, no watermark.
```

---

## สตูดิโอ (~24 ตร.ม.) → โฟลเดอร์ `studio/`

| ไฟล์ | prompt (ต่อท้ายส่วนสไตล์กลาง) |
|---|---|
| `studio/living.png` | `Compact 24 square meter studio: a queen bed with light linen bedding and a slim upholstered headboard on one side, a small two-seat sofa and round side table on the other, one floor-to-ceiling window with sliding door to a balcony, city view softly out of focus.` |
| `studio/kitchen.png` | `Compact linear pantry kitchen along one wall of a small studio: two-burner induction hob, slim range hood, built-in microwave, small sink, undercounter fridge, open shelf with a few ceramics.` |
| `studio/bathroom.png` | `Small modern condo bathroom: walk-in shower behind a clear glass screen, rain shower head, wall-hung toilet, floating vanity with a round mirror, large-format light grey porcelain tiles.` |
| `studio/balcony.png` | `Narrow condo balcony about 1.5 meters deep with a frameless glass railing, two small outdoor chairs and a potted plant, view over a generic Bangkok city skyline in late afternoon light.` |

## 1 ห้องนอน (~30–35 ตร.ม.) → โฟลเดอร์ `1br/`

| ไฟล์ | prompt |
|---|---|
| `1br/living.png` | `One-bedroom condo living area: three-seat light grey sofa, low oak coffee table, wall-mounted TV on a slim oak console, small dining table for two near the window, sliding glass door to the balcony.` |
| `1br/bedroom.png` | `Separate bedroom with a queen bed, upholstered headboard, oak bedside tables with brass lamps, built-in wardrobe with flush oak doors, one window with sheer curtains.` |
| `1br/kitchen.png` | `L-shaped pantry kitchen connected to the living area: induction hob, range hood, built-in microwave, single sink, tall fridge integrated into oak cabinetry.` |
| `1br/bathroom.png` | `Modern condo bathroom: glass-enclosed walk-in shower, rain shower, wall-hung toilet, floating vanity with a rectangular mirror and brass faucet, light grey large-format tiles.` |
| `1br/balcony.png` | `Condo balcony about 1.5 meters deep with a frameless glass railing, a small bistro table with two chairs and a planter, view over a generic Bangkok skyline at golden hour.` |

## 2 ห้องนอน (~45–55 ตร.ม.) → โฟลเดอร์ `2br/`

| ไฟล์ | prompt |
|---|---|
| `2br/living.png` | `Two-bedroom condo open-plan living and dining room: L-shaped sofa, oak coffee table, dining table for four with a pendant light, wide floor-to-ceiling windows, sliding door to a balcony.` |
| `2br/bedroom.png` | `Master bedroom in a two-bedroom condo: king bed with upholstered headboard, bedside tables with brass lamps, built-in wardrobe, small work desk by the window.` |
| `2br/kitchen.png` | `Closed modern kitchen with glass sliding door: U-shaped oak cabinetry, induction hob, built-in oven, range hood, full-height fridge, sink under the window.` |
| `2br/bathroom.png` | `Master bathroom: walk-in shower with glass partition, rain shower and hand shower, wall-hung toilet, wide floating vanity with a single basin, large mirror with backlight, light grey stone-look tiles.` |

## 2 ห้องนอน พลัส (~60–65 ตร.ม., ห้องมุม) → โฟลเดอร์ `2br_plus/`

| ไฟล์ | prompt |
|---|---|
| `2br_plus/living.png` | `Spacious corner two-bedroom condo living room with windows on two sides, panoramic city view, large L-shaped sofa, oak coffee table, dining table for six, styled bookshelf.` |
| `2br_plus/bedroom.png` | `Large corner master bedroom with windows on two sides: king bed, bench at the foot of the bed, lounge chair by the window, walk-in wardrobe with an open door visible.` |
| `2br_plus/kitchen.png` | `Premium closed kitchen with a small island: oak and white quartz cabinetry, induction hob, built-in oven and microwave, wine fridge, full-height integrated fridge.` |
| `2br_plus/bathroom.png` | `Premium master bathroom: freestanding bathtub beside a window, separate glass walk-in shower, double floating vanity, large mirror, light stone-look tiles, brass fixtures.` |

> ห้อง 2 ห้องนอน และ 2 ห้องนอน พลัส **ใช้ภาพระเบียงร่วมกับ `1br/balcony`** เพราะระเบียงหน้าตาเหมือนกัน

## Placeholder
ระหว่างที่ยังไม่มีภาพจริง โค้ดจะแสดงกรอบสีเทาที่มีชื่อห้อง และใช้ path เดียวกันกับภาพจริง พอใส่ภาพจริงเข้าไปแทนก็ใช้งานได้ทันที
