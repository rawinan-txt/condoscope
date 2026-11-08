# MASTER PROJECT SPECIFICATION
## CondoScope — Interactive Real Estate Discovery Platform

### 1. Project Overview

พัฒนาเว็บไซต์ค้นหาและเลือกซื้อคอนโดมิเนียมในประเทศไทย โดยมีจุดเด่นคือ **Interactive Building Explorer** ซึ่งผู้ใช้สามารถเลือกห้องคอนโดจากภาพตัวอาคารได้โดยตรง

เว็บไซต์ต้องให้ประสบการณ์เหมือนแพลตฟอร์มอสังหาริมทรัพย์จริง ตั้งแต่การค้นหาโครงการ การสำรวจทำเลผ่านแผนที่ การเลือกอาคารและห้อง ไปจนถึงการดูรายละเอียดและภาพภายในห้อง

ฟีเจอร์หลักได้รับแรงบันดาลใจจากแนวคิดการเลือกยูนิตบนภาพอาคารของเว็บไซต์ประเภท Interactive Real Estate Visualization เช่น CGIMMERSIVE.com แต่ต้องออกแบบ UI, โครงสร้างระบบ และองค์ประกอบต่าง ๆ ขึ้นใหม่ ไม่คัดลอกทรัพย์สินทางปัญญาของเว็บไซต์อื่น

**เป้าหมาย:** เว็บไซต์ Full-Stack สำหรับ Portfolio ที่สามารถเปิดทดลองใช้งานผ่านลิงก์สาธารณะได้จริง

**ชื่อโปรเจกต์ชั่วคราว:** CondoScope

**ภาษาหลัก:** ภาษาไทย

**สกุลเงิน:** บาทไทย (THB)

**งบประมาณ:** 0 บาท

---

# 2. Core Requirements

เว็บไซต์ต้องมีคุณสมบัติดังต่อไปนี้

- ค้นหาคอนโดตามชื่อโครงการ จังหวัด เขต อำเภอ ย่าน และช่วงราคา
- แสดงคอนโดในรูปแบบ Property Cards
- ค้นหาคอนโดผ่านแผนที่ประเทศไทย
- แสดงตำแหน่งโครงการผ่าน Map Markers
- คลิกหมุดเพื่อดูข้อมูลเบื้องต้นของโครงการ
- เปิดดูรายละเอียดคอนโดแต่ละโครงการ
- แสดงภาพอาคารคอนโดแบบสมจริง
- เลือกห้องจากตำแหน่งบนภาพอาคารโดยตรง
- Hover เพื่อไฮไลต์ห้องและแสดงข้อมูล
- คลิกห้องเพื่อเปิดหน้ารายละเอียด
- แสดง Floor Plan ของห้อง
- คลิก Hotspots บน Floor Plan เพื่อดูภาพภายในแต่ละบริเวณ
- รองรับ Desktop, Tablet และ Mobile
- เชื่อมต่อ Backend API และ SQL Database จริง
- Deploy ออนไลน์โดยไม่ต้องเปิดคอมพิวเตอร์ทิ้งไว้

เว็บไซต์ต้องมีการทำงานจริง ไม่ใช่เพียง Static Mockup ที่แสดงภาพโดยไม่มี Interaction

---

# 3. Project Data

ใช้โครงการคอนโดจำลองจำนวน **5 โครงการ**

ใช้พื้นที่ทางภูมิศาสตร์จริงในประเทศไทย เช่น กรุงเทพฯ นนทบุรี ปทุมธานี สมุทรปราการ และจังหวัดอื่นที่เหมาะสม

ข้อมูลที่ใช้จริง:
- ชื่อจังหวัด
- ชื่อเขตและอำเภอ
- ชื่อย่าน
- พิกัดทางภูมิศาสตร์สำหรับแผนที่
- ข้อมูลแผนที่จากผู้ให้บริการที่อนุญาตให้ใช้ฟรี

ข้อมูลที่สร้างจำลอง:
- ชื่อโครงการ
- ภาพอาคาร
- จำนวนชั้น
- จำนวนห้อง
- ราคาขาย
- ขนาดห้อง
- จำนวนห้องนอนและห้องน้ำ
- สถานะห้อง
- สิ่งอำนวยความสะดวก
- Floor Plans
- ภาพภายในห้อง

ต้องระบุให้ชัดเจนว่าข้อมูลโครงการเป็นข้อมูลจำลองสำหรับ Demonstration และไม่มีการประกาศขายอสังหาริมทรัพย์จริง

## Featured Project

กำหนดให้หนึ่งโครงการเป็น Featured Project ที่มีระบบ Interactive Building Explorer สมบูรณ์

อีกสี่โครงการต้องสามารถค้นหา แสดงบนแผนที่ และเปิดดูรายละเอียดพื้นฐานได้

ออกแบบ Data Structure ให้สามารถเพิ่มระบบ Interactive Building ให้ทุกโครงการในอนาคตโดยไม่ต้องเปลี่ยน Architecture หลัก

---

# 4. Technology Stack

## Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Router
- Lucide Icons

## Interactive Building

- React
- SVG Polygon Overlay
- SVG viewBox
- Responsive Image Mapping
- Mouse Hover Events
- Click Events
- Touch Events
- Keyboard Interaction

## Maps

- MapLibre GL JS
- แหล่งข้อมูลแผนที่ฟรีที่อนุญาตให้ใช้งานตามเงื่อนไข
- Geographic Coordinates
- Interactive Map Markers

ต้องแสดง Attribution ของผู้ให้บริการแผนที่อย่างถูกต้อง และไม่ใช้ Public Tile Server เกินขอบเขตที่นโยบายอนุญาต

## Backend

- Cloudflare Workers
- TypeScript
- REST API
- Hono Framework (หากเหมาะสม)

## Database

- Cloudflare D1
- SQLite-Compatible SQL
- Database Migrations
- Seed Data

## Hosting

- GitHub Pages สำหรับ Frontend
- Cloudflare Workers สำหรับ Backend
- Cloudflare D1 สำหรับ Database

## Images

- AI-Generated Images หรือภาพที่สร้างเอง
- WebP / AVIF สำหรับภาพที่เหมาะสม
- เก็บภาพใน Static Assets ของ Frontend
- ไม่ใช้ Paid Image Storage

## Version Control

- Git
- GitHub

---

# 5. Zero-Cost Requirements

**ห้ามมีค่าใช้จ่ายจริงในการพัฒนาและ Deploy โปรเจกต์**

ใช้บริการ Free Tier และ Open-Source Software เท่านั้น

ข้อกำหนด:

1. ไม่ใช้ Paid APIs
2. ไม่ซื้อ Domain
3. ไม่เช่า VPS หรือ Dedicated Server
4. ไม่ใช้ Paid Image Hosting
5. ไม่เปิดใช้งาน Paid Plans
6. ไม่ผูกระบบที่เรียกเก็บเงินอัตโนมัติ
7. ไม่ใช้บริการที่บังคับผูกบัตรเครดิตเพื่อเริ่มต้น
8. ต้องสามารถ Deploy ได้โดยไม่เปิดคอมพิวเตอร์ส่วนตัว
9. ต้องออกแบบระบบให้อยู่ภายใน Free-Tier Quotas
10. ต้องมี Error Handling เมื่อบริการภายนอกไม่พร้อมใช้งาน

หากโควตาฟรีหมด ระบบควรแสดงข้อผิดพลาดอย่างเหมาะสม และไม่เปลี่ยนไปใช้บริการแบบเสียเงินโดยอัตโนมัติ

ต้องตรวจสอบข้อจำกัดของ Free Tier และเงื่อนไขการใช้งานล่าสุดก่อนตั้งค่าบริการจริง

---

# 6. System Architecture

ใช้สถาปัตยกรรมแยก Frontend, Backend และ Database

```text
              USER / BROWSER
                     |
                     v
             GITHUB PAGES
                     |
              React + Vite
                     |
          -----------------------
          |          |          |
          v          v          v
      Search UI    Map UI    Building UI
          |          |          |
          -----------------------
                     |
                HTTPS REST
                     |
                     v
            CLOUDFLARE WORKERS
                     |
                API / Logic
                     |
                     v
               CLOUDFLARE D1
                     |
               SQL DATABASE
```

Frontend ทำหน้าที่แสดงผลและจัดการ Interaction

Backend ทำหน้าที่รับ API Requests ตรวจสอบข้อมูล ดำเนิน Business Logic และเชื่อมต่อฐานข้อมูล

Database จัดเก็บข้อมูลโครงการ อาคาร ชั้น ห้อง ราคา สถานะ และตำแหน่ง Interactive

Static Images ให้บริการผ่าน GitHub Pages

ต้องออกแบบ CORS, Environment Variables, Error Handling และการจัดการ API URLs ให้ถูกต้อง

ห้ามเก็บ Secret Keys หรือ Administrative Credentials ไว้ใน Frontend

ต้องรองรับการ Deploy บน GitHub Pages ที่มี Repository Base Path และจัดการ Client-Side Routing ให้เปิดลิงก์หน้าภายในหรือ Refresh ได้ถูกต้อง

---

# 7. Database Design

ออกแบบ Relational Database โดยใช้ Cloudflare D1

ตารางหลักที่ต้องพิจารณา:

## projects

เก็บข้อมูลโครงการ

Fields:
- id
- name
- slug
- description
- province
- district
- neighborhood
- latitude
- longitude
- address_display
- thumbnail_url
- starting_price
- total_floors
- total_units
- is_featured
- created_at
- updated_at

## buildings

เก็บข้อมูลอาคาร

Fields:
- id
- project_id
- name
- building_code
- total_floors
- created_at

## floors

เก็บข้อมูลชั้น

Fields:
- id
- building_id
- floor_number
- floor_label

## units

เก็บข้อมูลห้อง

Fields:
- id
- building_id
- floor_id
- unit_number
- price
- area_sqm
- bedrooms
- bathrooms
- direction
- status
- description
- created_at
- updated_at

Unit Status:
- available
- reserved
- sold
- unavailable

## building_views

เก็บภาพอาคารแต่ละมุม

Fields:
- id
- building_id
- view_name
- image_url
- svg_viewbox_width
- svg_viewbox_height

## unit_polygons

เก็บพิกัดพื้นที่ที่คลิกได้บนภาพอาคาร

Fields:
- id
- unit_id
- building_view_id
- polygon_points

Polygon Points ต้องใช้ระบบพิกัดที่สอดคล้องกับ SVG viewBox และภาพอาคาร

## unit_images

เก็บภาพประกอบของห้อง

Fields:
- id
- unit_id
- image_url
- image_type
- caption
- sort_order

## floor_plans

เก็บข้อมูลแปลนห้อง

Fields:
- id
- unit_id
- image_url
- width
- height

## floor_plan_hotspots

เก็บตำแหน่งที่คลิกได้บนแปลน

Fields:
- id
- floor_plan_id
- unit_image_id
- label
- position_x
- position_y

## amenities

เก็บสิ่งอำนวยความสะดวก

Fields:
- id
- name
- icon

## project_amenities

เชื่อมความสัมพันธ์ระหว่างโครงการกับสิ่งอำนวยความสะดวก

Fields:
- project_id
- amenity_id

ต้องออกแบบ:
- Primary Keys
- Foreign Keys
- Unique Constraints
- Indexes
- Data Validation
- Database Migrations
- Seed Data
- ER Diagram

สามารถปรับปรุงโครงสร้างตารางให้เหมาะสมได้ โดยต้องรักษาความสัมพันธ์ของข้อมูลและไม่สร้างตารางซ้ำซ้อนโดยไม่จำเป็น

---

# 8. REST API

ออกแบบ Backend API สำหรับดึงข้อมูลจาก Cloudflare D1

ตัวอย่าง Endpoints:

```text
GET /api/health

GET /api/projects
GET /api/projects/:projectId

GET /api/projects/:projectId/buildings

GET /api/buildings/:buildingId/floors
GET /api/buildings/:buildingId/views
GET /api/buildings/:buildingId/units

GET /api/units/:unitId
GET /api/units/:unitId/images
GET /api/units/:unitId/floor-plan
```

รองรับการค้นหาและกรองข้อมูล เช่น:

```text
GET /api/projects?province=Bangkok

GET /api/projects?minPrice=2000000&maxPrice=5000000

GET /api/buildings/1/units?floor=18

GET /api/buildings/1/units?status=available
```

ต้องมี:
- JSON Responses
- Input Validation
- Appropriate HTTP Status Codes
- Consistent Error Responses
- SQL Parameter Binding
- CORS Configuration
- Loading States
- Empty States
- API Error Handling

สำหรับข้อมูลสาธารณะสามารถใช้ Read-Only API ได้

ยังไม่จำเป็นต้องพัฒนาระบบ Authentication หรือ Admin Dashboard แบบเต็มรูปแบบ

---

# 9. UI/UX Design Direction

เว็บไซต์ต้องมีความรู้สึกเป็นแพลตฟอร์มอสังหาริมทรัพย์ระดับมืออาชีพ

Design Style:
- Modern
- Minimal
- Premium
- Architectural
- Clean
- Professional
- Responsive
- User-Friendly

ใช้สี Neutral เป็นหลัก เช่น White, Slate, Gray และใช้ Accent Color เพียงหนึ่งสีสำหรับ Interactive Elements

หลีกเลี่ยงการใช้ Gradient และ Animation ที่มากเกินไป

Typography ต้องรองรับภาษาไทยอย่างสวยงามและอ่านง่าย

ใช้ Layout ที่มีระยะห่างเหมาะสมและ Visual Hierarchy ชัดเจน

เว็บไซต์ต้องรองรับทั้ง Light Mode เป็นหลัก และสามารถเพิ่ม Dark Mode ภายหลังได้

---

# 10. Required Pages

## Page 1 — Homepage / Discover

องค์ประกอบ:
- Navigation Bar
- Logo
- Hero Section
- Main Search Bar
- Location Search
- Price Filters
- Featured Projects
- Condominium Cards
- Explore Map Button
- Footer

ผู้ใช้ต้องสามารถค้นหาคอนโดได้ทั้งจากชื่อและทำเล

Property Card ต้องแสดง:
- Project Image
- Project Name
- Location
- Starting Price
- Basic Project Information
- View Details Button

## Page 2 — Map Explorer

แสดงแผนที่ประเทศไทยพร้อมตำแหน่งโครงการ

องค์ประกอบ:
- Interactive Map
- Project Markers
- Search Bar
- Location Filters
- Price Filters
- Property List
- Marker Popup

เมื่อคลิกหมุด ต้องแสดงข้อมูลเบื้องต้นและสามารถเข้าสู่หน้าโครงการได้

Desktop ควรแสดงรายการคอนโดด้านข้างแผนที่

Mobile ควรมี Map/List Toggle

## Page 3 — Project Detail

องค์ประกอบ:
- Project Image Gallery
- Project Name
- Location
- Starting Price
- Amenities
- Building Information
- Project Description
- Available Units Overview
- Explore Building Button

ต้องมีปุ่มเข้าสู่ Interactive Building Explorer อย่างชัดเจน

## Page 4 — Interactive Building Explorer

**นี่คือฟีเจอร์สำคัญที่สุดของโปรเจกต์**

แสดงภาพอาคารคอนโดขนาดใหญ่ พร้อมพื้นที่ Interactive Overlay บนห้องแต่ละห้อง

ผู้ใช้สามารถนำเมาส์ไปชี้ห้องบนภาพอาคารได้

เมื่อ Hover:
- ห้องถูก Highlight
- แสดง Tooltip
- แสดงข้อมูลห้องที่ตรงกับตำแหน่ง

Tooltip ต้องมี:
- Unit Number
- Floor Number
- Price
- Area
- Bedrooms
- Bathrooms
- Availability Status

เมื่อ Click:
- เลือกห้อง
- แสดงรายละเอียดเพิ่มเติม
- สามารถเข้าสู่ Unit Detail Page

ต้องมี Floor Selector และ Unit List สำหรับเลือกห้องที่มองไม่เห็นบนภาพอาคาร

แสดงสถานะห้องด้วยสีที่แตกต่างกัน พร้อม Legend และข้อความอธิบาย

ต้องรองรับ:
- Mouse Hover
- Mouse Click
- Touch Selection
- Keyboard Navigation
- Responsive Scaling

## Page 5 — Unit Detail

องค์ประกอบ:
- Unit Number
- Floor
- Price
- Area
- Bedrooms
- Bathrooms
- Direction
- Availability Status
- Unit Image Gallery
- Floor Plan
- Interactive Hotspots
- Interior Image Viewer
- Back to Building Explorer

ผู้ใช้สามารถคลิกจุดบน Floor Plan เพื่อดูภาพภายในบริเวณนั้นได้

ตัวอย่าง Hotspots:
- Living Room
- Bedroom
- Kitchen
- Bathroom
- Balcony

เมื่อคลิก Hotspot ต้องเปลี่ยนภาพที่แสดงตามตำแหน่งที่เลือก

---

# 11. Interactive Building Technical Requirements

ใช้ภาพอาคารเป็น Background Image และ SVG Polygon Overlay เป็นพื้นที่ Interactive

แต่ละ Polygon ต้องเชื่อมกับ Unit ID ใน Database

ตัวอย่างข้อมูล:

```json
{
  "unitId": "A-1805",
  "buildingViewId": "front-view",
  "polygonPoints": [
    [120, 240],
    [180, 240],
    [180, 290],
    [120, 290]
  ]
}
```

เมื่อ Hover Polygon:

1. ตรวจจับ Unit ID
2. อ่านข้อมูลห้องจากข้อมูลที่โหลดไว้
3. Highlight Polygon
4. แสดง Tooltip
5. แสดงสถานะและรายละเอียด

เมื่อ Click Polygon:

1. เลือก Unit
2. อัปเดต Selected Unit State
3. แสดงข้อมูลเพิ่มเติม
4. เปิด Unit Detail เมื่อผู้ใช้เลือกดูรายละเอียด

ต้องไม่ยิง API Request ใหม่ทุกครั้งที่ Mouse Move

ควรโหลดข้อมูลห้องและ Polygon ของอาคารหรือชั้นที่เลือกไว้ล่วงหน้า แล้วจัดการ Hover ผ่าน Client-Side State

ต้องใช้ระบบพิกัดที่สัมพันธ์กับภาพอาคาร เพื่อไม่ให้ Polygon เคลื่อนผิดตำแหน่งเมื่อหน้าจอเปลี่ยนขนาด

ภาพอาคารต้องถูกออกแบบให้ตำแหน่งหน้าต่าง ระเบียง และห้องสอดคล้องกับ Polygon ที่กำหนด

ควรมีวิธีตรวจสอบและปรับตำแหน่ง Polygon ระหว่างการพัฒนา

---

# 12. Interactive Floor Plan

ระบบ Floor Plan ต้องแสดงภาพแปลนห้องพร้อม Hotspots

Hotspot แต่ละจุดเชื่อมกับภาพภายในห้อง

ตัวอย่าง:

```json
{
  "hotspotId": "living-room",
  "unitId": "A-1805",
  "label": "ห้องนั่งเล่น",
  "position": {
    "x": 45,
    "y": 62
  },
  "image": "/images/units/A-1805/living-room.webp"
}
```

เมื่อคลิก Hotspot ให้แสดงภาพของห้องนั้นทันที

รองรับ:
- Image Gallery
- Hotspot Selection
- Active Hotspot Indicator
- Smooth Image Transitions
- Mobile Touch Interaction

ไม่จำเป็นต้องพัฒนา 3D Walkthrough แบบเดินอิสระ

---

# 13. Repository Structure

แนะนำ Monorepo Structure ดังนี้

```text
condoscope/
|
|-- apps/
|   |-- web/
|   |   |-- public/
|   |   |   |-- images/
|   |   |   |   |-- projects/
|   |   |   |   |-- buildings/
|   |   |   |   |-- units/
|   |   |   |   |-- floor-plans/
|   |   |
|   |   |-- src/
|   |   |   |-- components/
|   |   |   |-- pages/
|   |   |   |-- features/
|   |   |   |-- hooks/
|   |   |   |-- services/
|   |   |   |-- types/
|   |   |   |-- data/
|   |   |   |-- utils/
|   |   |
|   |   |-- package.json
|   |   |-- vite.config.ts
|   |
|   |-- api/
|       |-- src/
|       |   |-- routes/
|       |   |-- services/
|       |   |-- middleware/
|       |   |-- index.ts
|       |
|       |-- wrangler.jsonc
|       |-- package.json
|
|-- packages/
|   |-- shared/
|
|-- database/
|   |-- migrations/
|   |-- seeds/
|
|-- docs/
|   |-- architecture.md
|   |-- database.md
|   |-- api.md
|   |-- ui-ux.md
|
|-- .github/
|   |-- workflows/
|
|-- README.md
|-- package.json
```

สามารถปรับโครงสร้างให้เหมาะสมกับการพัฒนาจริงได้ โดยหลีกเลี่ยงความซับซ้อนที่ไม่จำเป็น

---

# 14. Performance Requirements

เว็บไซต์ต้องโหลดได้รวดเร็วและตอบสนองต่อการใช้งานได้ดี

ข้อกำหนด:
- Lazy Load Images
- Optimize Images
- Minimize Unnecessary API Requests
- Cache Public Data Appropriately
- Avoid Re-rendering All Units on Every Mouse Movement
- Responsive Image Rendering
- Efficient SVG Interaction
- Mobile-Friendly Layout
- Proper Loading Indicators

ควรออกแบบให้ระบบ Interactive Building ทำงานลื่นไหลแม้มี Polygon หลายสิบหรือหลายร้อยพื้นที่

---

# 15. Accessibility Requirements

รองรับการใช้งานผ่าน:
- Mouse
- Keyboard
- Touchscreen

Interactive Elements ต้องมี:
- Accessible Labels
- Visible Focus States
- Sufficient Color Contrast
- Clear Status Indicators
- Appropriate Button Semantics

ห้ามใช้สีเพียงอย่างเดียวในการบอกสถานะห้อง

ต้องมี Unit List เป็นทางเลือกสำหรับผู้ใช้ที่ไม่สามารถเลือกห้องจากภาพอาคารได้สะดวก

---

# 16. Reliability and Fallback

เนื่องจากใช้ Free-Tier Cloud Services ต้องรองรับกรณี Backend หรือ Database ไม่พร้อมใช้งาน

ออกแบบ Local Demo Dataset สำหรับข้อมูลสาธารณะที่จำเป็น

เมื่อ API ไม่พร้อมใช้งาน:
- เว็บไซต์ยังเปิดได้
- หน้า Home ยังแสดงโครงการตัวอย่างได้
- Map ยังแสดงตำแหน่งโครงการจากข้อมูลสำรองได้ หากแผนที่ยังให้บริการ
- Interactive Building ยังสามารถใช้ข้อมูลสำรองเพื่อทดลองเลือกห้องได้
- แสดงข้อความว่าอยู่ใน Demo Fallback Mode

ข้อมูลสำรองต้องสอดคล้องกับ Database Seed Data

ห้ามแสดงว่าข้อมูลสำรองเป็นข้อมูล Live จาก Database

---

# 17. Security Requirements

- Validate API Inputs
- Use Parameterized SQL Queries
- Prevent SQL Injection
- Avoid Exposing Secrets
- Configure CORS Correctly
- Do Not Expose Administrative Endpoints Without Authentication
- Handle Errors Without Leaking Internal Information
- Apply Reasonable Request Limits Where Supported
- Do Not Store Sensitive Personal Data Unnecessarily

ระบบ MVP สามารถเป็น Public Read-Only Application ได้

ยังไม่ต้องสร้างระบบชำระเงินหรือระบบเก็บข้อมูลการเงินของผู้ใช้

---

# 18. Deployment Requirements

Frontend ต้อง Deploy บน GitHub Pages ได้

Backend ต้อง Deploy บน Cloudflare Workers Free Tier ได้

Database ต้องใช้ Cloudflare D1 Free Tier

ต้องเตรียม:
- Environment Configuration
- GitHub Pages Base Path
- Client-Side Routing Strategy
- Cloudflare Worker Configuration
- D1 Database Binding
- SQL Migrations
- Seed Scripts
- Build Commands
- Deployment Instructions
- GitHub Actions Workflow หากเหมาะสม

ระบบต้องทำงานโดยไม่ต้องเปิดเครื่องคอมพิวเตอร์ของผู้พัฒนาไว้ตลอดเวลา

ต้องมี Public Demo URL และ Source Code Repository สำหรับ Portfolio

---

# 19. Portfolio Quality Requirements

โปรเจกต์ต้องมีคุณภาพเพียงพอสำหรับแสดงใน Portfolio และ GitHub

ต้องมี:
- Professional UI
- Functional Interactive Building
- Functional Search and Filtering
- Interactive Map
- Unit Detail Pages
- Interactive Floor Plans
- Real Backend API
- Real SQL Database
- Responsive Design
- Clean Code Structure
- README Documentation
- Architecture Documentation
- Screenshots
- Live Demo Link

README ควรอธิบาย:
- Project Overview
- Features
- Tech Stack
- Architecture
- Database Design
- Installation
- Local Development
- Deployment
- Screenshots
- Demo Data Disclaimer

---

# 20. Out of Scope

ยังไม่ต้องพัฒนา:
- ระบบซื้อขายอสังหาริมทรัพย์จริง
- Payment Gateway
- ระบบโอนกรรมสิทธิ์
- ระบบจองห้องจริง
- ระบบแชตแบบ Real-Time
- ระบบนายหน้าเต็มรูปแบบ
- Seller Marketplace
- ระบบบ้านจัดสรร
- 3D Walkthrough แบบเดินอิสระ
- AI Recommendation Engine
- ระบบสมาชิกและ Admin Dashboard แบบเต็มรูปแบบ

สามารถเพิ่มฟีเจอร์เหล่านี้ภายหลังได้

---

# 21. Expected Result

ผลลัพธ์สุดท้ายต้องเป็นเว็บไซต์ที่ผู้ใช้สามารถ:

1. เปิดหน้าเว็บผ่าน GitHub Pages
2. ค้นหาคอนโดจำลองในประเทศไทย
3. กรองข้อมูลตามทำเลและราคา
4. สำรวจโครงการผ่านแผนที่จริง
5. เลือกโครงการที่สนใจ
6. เปิดภาพอาคารคอนโด
7. เอาเมาส์ชี้ห้องบนตัวอาคาร
8. เห็นข้อมูลห้องผ่าน Interactive Tooltip
9. คลิกเลือกห้อง
10. เปิดหน้ารายละเอียดห้อง
11. ดู Floor Plan
12. คลิก Hotspots เพื่อดูภาพภายใน
13. กลับไปเลือกห้องอื่นได้

ระบบต้องมี Frontend, Backend และ Database ที่เชื่อมต่อกันจริง โดยมีข้อมูลสำรองสำหรับการสาธิตเมื่อบริการ Cloud ไม่พร้อมใช้งาน

**Primary Success Criterion:**

ผู้ใช้สามารถเลือกห้องคอนโดจากภาพตัวอาคารได้จริง และข้อมูลที่แสดงต้องตรงกับห้องที่เลือก

**Budget Constraint:**

0 THB — Free-Tier and Open-Source Only.

**Deployment Target:**

GitHub Pages + Cloudflare Workers + Cloudflare D1.

**Final Objective:**

A fully functional, visually polished, interactive condominium discovery website suitable for a professional software development portfolio.

---

# Implementation Instructions

ใช้ข้อกำหนดทั้งหมดข้างต้นเป็นแหล่งอ้างอิงหลักในการออกแบบและพัฒนาโปรเจกต์

ก่อนลงมือพัฒนา ให้ตรวจสอบความสอดคล้องของ Architecture, Database Schema, API Contracts และ Interactive Building Data Model

จากนั้นดำเนินการพัฒนาเป็นส่วนย่อยที่สามารถทดสอบได้ โดยให้ความสำคัญกับ Interactive Building Explorer เป็นอันดับแรก

ไม่ต้องกำหนดกรอบเวลาการพัฒนา ไม่ต้องแบ่งบทบาทของบุคคล และไม่ต้องเพิ่มข้อกำหนดนอกเหนือจาก Scope โดยไม่จำเป็น

หากมีทางเลือกทางเทคนิคหลายแบบ ให้เลือกวิธีที่เรียบง่าย เสถียร บำรุงรักษาง่าย และไม่มีค่าใช้จ่ายจริง

ให้ใช้ข้อกำหนดนี้เป็น Project Source of Truth ตลอดการพัฒนา