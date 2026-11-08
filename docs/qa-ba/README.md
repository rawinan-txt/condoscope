# เอกสาร QA / BA — CondoScope

> สถานะ: **ร่าง** (เตรียมไว้ก่อนระบบเสร็จ) · เจ้าของเอกสาร: rawinan-txt
> โฟลเดอร์นี้คือผลงานด้าน QA/BA ของฉันในโปรเจกต์นี้ โค้ดส่วนใหญ่สร้างด้วย AI (Claude Code) ส่วนการกำหนดความต้องการ การตัดสินใจ และการทดสอบเป็นงานของฉัน

## ไฟล์ในโฟลเดอร์นี้

| ไฟล์ | บทบาท | ใช้ทำอะไร |
|---|---|---|
| [`user-stories.md`](user-stories.md) | BA | ความต้องการในมุมผู้ใช้ พร้อม acceptance criteria |
| [`user-flow.md`](user-flow.md) | BA | แผนภาพเส้นทางการใช้งานหลัก |
| [`decision-log.md`](decision-log.md) | BA | บันทึกการตัดสินใจสำคัญ ทางเลือกที่มี และเหตุผล |
| [`test-plan.md`](test-plan.md) | QA | ขอบเขต วิธีทดสอบ อุปกรณ์ และเกณฑ์ผ่าน |
| [`test-cases.md`](test-cases.md) | QA | test case ทั้งหมด (ช่องผลจริงและสถานะ ฉันกรอกเองตอนทดสอบ) |
| [`traceability-matrix.md`](traceability-matrix.md) | QA/BA | โยง requirement → user story → test case |
| [`bug-report-template.md`](bug-report-template.md) | QA | แบบฟอร์มรายงานบั๊ก (ย้ายไป `.github/ISSUE_TEMPLATE/bug_report.md` เพื่อให้ขึ้นเป็นตัวเลือกใน GitHub Issues) |

## สิ่งที่ฉันต้องทำเองเมื่อระบบเสร็จ
- [ ] ย้าย `bug-report-template.md` ไปไว้ที่ `.github/ISSUE_TEMPLATE/bug_report.md` (หรือสั่ง Claude Code ให้ย้าย)
- [ ] อ่าน user stories และ test cases ทวนกับเว็บจริง แล้วปรับข้อความให้ตรงกับที่สร้างออกมา
- [ ] ทดสอบทุก test case บน desktop และมือถือ แล้วกรอก "ผลจริง" และ "สถานะ"
- [ ] เจอบั๊กให้เปิด GitHub Issue ตาม template แล้วใส่เลข issue ใน test case
- [ ] อัปเดต traceability matrix ให้ครบ
- [ ] (แนะนำ) เขียน Playwright test เองอย่างน้อย 3 เคส
- [ ] สรุปผลทดสอบท้าย `test-plan.md` (จำนวนผ่าน/ไม่ผ่าน, บั๊กที่เจอแยกตามความรุนแรง)
- [ ] เขียน "บทบาทของฉันและการใช้ AI" ใน README หลักด้วยคำของตัวเอง

## รหัสที่ใช้ในเอกสาร
- `REQ-xx` requirement (อ้างอิงสเปก `docs/specs/2026-11-09-condoscope-design.md`)
- `US-xx` user story
- `TC-xxx` test case
- `D-xx` การตัดสินใจ
- `#nn` เลข GitHub Issue
