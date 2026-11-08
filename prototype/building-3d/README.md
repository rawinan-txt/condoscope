# ต้นแบบ Building Explorer 3D (ทิ้งได้)

ต้นแบบนี้ทำไว้ทดสอบหน้าตาและการโต้ตอบเท่านั้น ไม่ใช่โค้ดจริง

- `index.html` ไฟล์ที่ build แล้ว ดับเบิลคลิกเปิดในเบราว์เซอร์ได้เลย
- `main.js` + `template.html` ซอร์ส (Three.js 0.187)
- build: `npm i three esbuild && npx esbuild main.js --bundle --minify --format=iife --outfile=bundle.js` แล้วแทนที่ `/*BUNDLE*/` ใน template.html ด้วยเนื้อหาของ bundle.js
