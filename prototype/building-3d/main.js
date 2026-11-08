// CondoScope — 3D building explorer SPIKE (throwaway prototype)
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// ---------- seeded random ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20261109);

// ---------- building data ----------
const FH = 3.2;
const PODIUM_FLOORS = 6;
const PODIUM_H = PODIUM_FLOORS * 3.6;
const TOWERS = [
  { code: 'A', cx: -14, cz: -6, widths: [7, 4, 3.2, 3.2, 4, 8.6], D: 17, corridor: 2, first: 7, last: 38 },
  { code: 'B', cx: 17, cz: -6, widths: [6.5, 3.2, 4, 3.8, 6.5], D: 17, corridor: 2, first: 7, last: 30 },
];
TOWERS.forEach((t) => { t.W = t.widths.reduce((a, b) => a + b, 0); t.d = (t.D - t.corridor) / 2; });
const floorBaseY = (t, floor) => PODIUM_H + (floor - t.first) * FH;

const STATUS = {
  available: { label: 'ว่าง', color: new THREE.Color(0x22c55e), k: 1.1, css: '#16a34a' },
  reserved: { label: 'จองแล้ว', color: new THREE.Color(0xf59e0b), k: 1.0, css: '#d97706' },
  sold: { label: 'ขายแล้ว', color: new THREE.Color(0xe11d48), k: 0.55, css: '#e11d48' },
  unavailable: { label: 'ไม่เปิดขาย', color: new THREE.Color(0x64748b), k: 0.25, css: '#64748b' },
};

const units = [];
for (const t of TOWERS) {
  const n = t.widths.length;
  for (let floor = t.first; floor <= t.last; floor++) {
    for (const row of ['front', 'back']) {
      let acc = t.cx - t.W / 2;
      for (let i = 0; i < n; i++) {
        const w = t.widths[i];
        const x = acc + w / 2; acc += w;
        const z = row === 'front' ? t.cz + t.corridor / 2 + t.d / 2 : t.cz - t.corridor / 2 - t.d / 2;
        const area = Math.round(w * t.d * 10) / 10;
        const corner = i === 0 || i === n - 1;
        let type, bedrooms, bathrooms;
        if (area < 27) { type = 'สตูดิโอ'; bedrooms = 0; bathrooms = 1; }
        else if (area < 40) { type = '1 ห้องนอน'; bedrooms = 1; bathrooms = 1; }
        else if (area < 56) { type = '2 ห้องนอน'; bedrooms = 2; bathrooms = 1; }
        else { type = '2 ห้องนอน พลัส'; bedrooms = 2; bathrooms = 2; }
        const perSqm = 128000 * (1 + (floor - t.first) * 0.006) * (corner ? 1.05 : 1) * (row === 'front' ? 1.04 : 1);
        const price = Math.round((area * perSqm) / 10000) * 10000;
        const r = rng();
        const status = r < 0.5 ? 'available' : r < 0.64 ? 'reserved' : r < 0.94 ? 'sold' : 'unavailable';
        const num = row === 'front' ? i + 1 : n + i + 1;
        units.push({
          id: `${t.code}-${floor}${String(num).padStart(2, '0')}`,
          tower: t.code, floor, row, x, z, w, d: t.d, area, corner, type, bedrooms, bathrooms,
          direction: (row === 'front' ? 'ทิศใต้' : 'ทิศเหนือ') + (corner ? ' (ห้องมุม)' : ''),
          price, status, baseStatus: status, mine: false,
          lit: rng() < 0.62, litK: 0.75 + rng() * 0.6,
        });
      }
    }
  }
}

// demo reservations persisted per browser
const STORE_KEY = 'condoscope-demo-reservations';
function loadMine() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; } }
function saveMine() { try { localStorage.setItem(STORE_KEY, JSON.stringify(units.filter((u) => u.mine).map((u) => u.id))); } catch {} }
for (const id of loadMine()) { const u = units.find((x) => x.id === id); if (u && u.baseStatus === 'available') { u.mine = true; u.status = 'reserved'; } }

// ---------- renderer / scene ----------
const container = document.getElementById('stage');
const coarse = matchMedia('(pointer: coarse)').matches;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  document.getElementById('nogl').hidden = false;
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 2));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 1, 5000);
const HOME = { pos: new THREE.Vector3(150, 62, 175), target: new THREE.Vector3(0, 52, -4) };
camera.position.copy(HOME.pos);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(HOME.target);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 35;
controls.maxDistance = 520;
controls.maxPolarAngle = Math.PI * 0.49;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35;

// ---------- sky ----------
const skyUniforms = {
  top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, horizon: { value: new THREE.Color() },
  glow: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(-0.6, 0.08, -0.8).normalize() },
};
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, uniforms: skyUniforms,
  vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; uniform vec3 glow; uniform vec3 sunDir; varying vec3 vDir;
    void main(){ float h = vDir.y; vec3 c = mix(horizon, mid, smoothstep(0.0, 0.16, h)); c = mix(c, top, smoothstep(0.16, 0.6, h));
      c = mix(c, horizon*0.55, smoothstep(0.0, -0.08, h));
      c += glow * pow(max(dot(normalize(vDir), sunDir), 0.0), 6.0) * smoothstep(-0.05, 0.25, 0.3 - h);
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
    }`,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(2400, 32, 16), skyMat);
scene.add(sky);
const envScene = new THREE.Scene();
envScene.add(new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), skyMat));
const pmrem = new THREE.PMREMGenerator(renderer);
let envRT = null;

// ---------- lights ----------
const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 1);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 110, bottom: -110, near: 10, far: 700 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target);

// ---------- shared shader helpers ----------
const uNight = { value: 1 };
function patchInstanced(mat, { vertDecl = '', vertMain = '', fragDecl = '', afterColor = '', afterEmissive = '' }) {
  const key = Math.random().toString(36);
  mat.customProgramCacheKey = () => key;
  mat.onBeforeCompile = (s) => {
    s.uniforms.uNight = uNight;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', `#include <common>\n${vertDecl}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${vertMain}`);
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uNight;\n${fragDecl}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${afterColor}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${afterEmissive}`);
  };
}
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
function boxMatrix(x, y, z, sx, sy, sz) { return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), tmpQ, new THREE.Vector3(sx, sy, sz)); }

// tracked instanced meshes that can be cut by floor
const cuttables = []; // { mesh, items: [{tower, floor, m}] }
function makeCuttable(geo, mat, items, { cast = true, receive = true } = {}) {
  const mesh = new THREE.InstancedMesh(geo, mat, items.length);
  items.forEach((it, i) => mesh.setMatrixAt(i, it.m));
  mesh.castShadow = cast; mesh.receiveShadow = receive;
  scene.add(mesh);
  cuttables.push({ mesh, items });
  return mesh;
}
const BOX = new THREE.BoxGeometry(1, 1, 1);

// ---------- unit glass boxes ----------
const glassMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.14, envMapIntensity: 1.1 });
patchInstanced(glassMat, {
  vertDecl: 'attribute vec3 aEmit; attribute vec3 aTint; varying vec3 vEmit; varying vec3 vTint;',
  vertMain: 'vEmit = aEmit; vTint = aTint;',
  fragDecl: 'varying vec3 vEmit; varying vec3 vTint;',
  afterColor: 'diffuseColor.rgb *= vTint;',
  afterEmissive: 'totalEmissiveRadiance += vEmit;',
});
const unitGeo = BOX.clone();
const emitArr = new Float32Array(units.length * 3);
const tintArr = new Float32Array(units.length * 3);
unitGeo.setAttribute('aEmit', new THREE.InstancedBufferAttribute(emitArr, 3));
unitGeo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tintArr, 3));
const unitItems = units.map((u) => {
  const t = TOWERS.find((x) => x.code === u.tower);
  return { tower: u.tower, floor: u.floor, m: boxMatrix(u.x, floorBaseY(t, u.floor) + FH / 2, u.z, u.w - 0.24, FH - 0.44, u.d - 0.1) };
});
const unitMesh = makeCuttable(unitGeo, glassMat, unitItems);

// ---------- slabs, inner fill, balconies, railings ----------
const slabItems = [], fillItems = [], balcItems = [], railItems = [];
for (const t of TOWERS) {
  for (let floor = t.first; floor <= t.last + 1; floor++) {
    const y = floorBaseY(t, floor);
    slabItems.push({ tower: t.code, floor, m: boxMatrix(t.cx, y, t.cz, t.W + 0.5, 0.44, t.D + 0.5) });
    if (floor <= t.last) fillItems.push({ tower: t.code, floor, m: boxMatrix(t.cx, y + (FH - 0.7) / 2, t.cz, t.W - 0.3, FH - 0.7, t.D - 0.3) });
  }
}
for (const u of units) {
  const t = TOWERS.find((x) => x.code === u.tower);
  const y = floorBaseY(t, u.floor);
  const s = u.row === 'front' ? 1 : -1;
  const zEdge = t.cz + s * (t.D / 2 + 0.75);
  balcItems.push({ tower: u.tower, floor: u.floor, m: boxMatrix(u.x, y + 0.08, zEdge, u.w - 0.35, 0.18, 1.5) });
  railItems.push({ tower: u.tower, floor: u.floor, m: boxMatrix(u.x, y + 0.65, t.cz + s * (t.D / 2 + 1.48), u.w - 0.35, 1.05, 0.05) });
}
const concreteMat = new THREE.MeshStandardMaterial({ color: 0xe4dfd6, roughness: 0.75 });
const fillMat = new THREE.MeshStandardMaterial({ color: 0x16191e, roughness: 0.9 });
const railMat = new THREE.MeshStandardMaterial({ color: 0xb8c7d4, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.35, depthWrite: false });
makeCuttable(BOX, concreteMat, slabItems);
const fillMesh = makeCuttable(BOX, fillMat, fillItems);
makeCuttable(BOX, concreteMat, balcItems);
makeCuttable(BOX, railMat, railItems, { cast: false, receive: false });

// ---------- crowns ----------
const crowns = {};
const darkGlass = new THREE.MeshStandardMaterial({ color: 0x1e2733, metalness: 0.9, roughness: 0.2 });
for (const t of TOWERS) {
  const g = new THREE.Group();
  const top = floorBaseY(t, t.last + 1);
  if (t.code === 'A') {
    const h = 8;
    const post = (x, z) => { const m = new THREE.Mesh(BOX, concreteMat); m.scale.set(0.7, h, 0.7); m.position.set(x, top + h / 2, z); g.add(m); };
    const x0 = t.cx - t.W / 2, x1 = t.cx + t.W / 2, z0 = t.cz - t.D / 2, z1 = t.cz + t.D / 2;
    [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].forEach(([x, z]) => post(x, z));
    for (let k = 0; k < 4; k++) {
      const ring = new THREE.Mesh(BOX, concreteMat);
      if (k < 2) { ring.scale.set(t.W, 0.6, 0.7); ring.position.set(t.cx, top + h - 0.3 - k * 4, k % 2 ? z0 : z1); }
      else { ring.scale.set(0.7, 0.6, t.D); ring.position.set(k === 2 ? x0 : x1, top + h - 0.3, t.cz); }
      g.add(ring);
    }
    const back = new THREE.Mesh(BOX, concreteMat); back.scale.set(t.W, 0.6, 0.7); back.position.set(t.cx, top + h - 0.3, z0); g.add(back);
    const mech = new THREE.Mesh(BOX, fillMat); mech.scale.set(t.W * 0.5, 3.5, t.D * 0.5); mech.position.set(t.cx, top + 1.75, t.cz); g.add(mech);
  } else {
    const mech = new THREE.Mesh(BOX, concreteMat); mech.scale.set(t.W * 0.6, 4, t.D * 0.7); mech.position.set(t.cx - 2, top + 2, t.cz); g.add(mech);
  }
  g.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  scene.add(g); crowns[t.code] = g;
}
// slender core between towers (like a lift/stair spine)
const spineTop = floorBaseY(TOWERS[0], 33);
const spine = new THREE.Mesh(BOX, darkGlass);
spine.scale.set(3.6, spineTop - PODIUM_H + 6, 9); spine.position.set(3, PODIUM_H + (spineTop - PODIUM_H + 6) / 2, -7);
spine.castShadow = true; scene.add(spine);
const spineLightMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.6, 1.0) });
const spineLight = new THREE.Mesh(BOX, spineLightMat);
spineLight.scale.set(0.35, spineTop - PODIUM_H, 0.2); spineLight.position.set(3, PODIUM_H + (spineTop - PODIUM_H) / 2 + 3, -2.4);
scene.add(spineLight);

// ---------- podium ----------
const podiumMat = new THREE.MeshStandardMaterial({ color: 0x6b6f75, roughness: 0.8 });
const podium = new THREE.Mesh(BOX, podiumMat);
podium.scale.set(72, PODIUM_H, 36); podium.position.set(0, PODIUM_H / 2, 0);
podium.castShadow = podium.receiveShadow = true; scene.add(podium);
const finMat = new THREE.MeshStandardMaterial({ color: 0xd8d3ca, roughness: 0.7 });
const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x2d4b2a, roughness: 0.95 });
const bandMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.15, 0.7) });
const podiumDeco = new THREE.Group();
for (let f = 1; f <= PODIUM_FLOORS; f++) {
  const y = f * 3.6;
  const fin = new THREE.Mesh(BOX, finMat); fin.scale.set(72.6, 0.35, 0.9); fin.position.set(0, y - 0.2, 18.2); podiumDeco.add(fin);
  const finS = new THREE.Mesh(BOX, finMat); finS.scale.set(0.9, 0.35, 36.6); finS.position.set(36.2, y - 0.2, 0); podiumDeco.add(finS);
  const finW = finS.clone(); finW.position.x = -36.2; podiumDeco.add(finW);
  if (f > 1 && f < PODIUM_FLOORS) {
    const hedge = new THREE.Mesh(BOX, hedgeMat); hedge.scale.set(72, 0.7, 0.6); hedge.position.set(0, y + 0.25, 18.55); podiumDeco.add(hedge);
  }
  if (f > 1) {
    const band = new THREE.Mesh(BOX, bandMat); band.scale.set(70, 0.25, 0.1); band.position.set(0, y - 2.0, 18.02); podiumDeco.add(band);
    const bandS = new THREE.Mesh(BOX, bandMat); bandS.scale.set(0.1, 0.25, 34); bandS.position.set(36.02, y - 2.0, 0); podiumDeco.add(bandS);
  }
}
scene.add(podiumDeco);
const lobbyMat = new THREE.MeshStandardMaterial({ color: 0x223040, metalness: 0.6, roughness: 0.2, emissive: 0xffd29a, emissiveIntensity: 1.4 });
const lobby = new THREE.Mesh(BOX, lobbyMat); lobby.scale.set(28, 3.2, 0.4); lobby.position.set(-6, 1.8, 18.1); scene.add(lobby);
// roof garden + pool
const lawn = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: 0x35553a, roughness: 0.95 }));
lawn.scale.set(71, 0.3, 35); lawn.position.set(0, PODIUM_H + 0.15, 0); lawn.receiveShadow = true; scene.add(lawn);
const deck = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: 0xcfc7b8, roughness: 0.8 }));
deck.scale.set(32, 0.34, 11); deck.position.set(-2, PODIUM_H + 0.17, 10.5); deck.receiveShadow = true; scene.add(deck);
const poolMat = new THREE.MeshStandardMaterial({ color: 0x4cc3df, roughness: 0.05, metalness: 0.1, emissive: 0x2bb6e6, emissiveIntensity: 1 });
const pool = new THREE.Mesh(BOX, poolMat); pool.scale.set(25, 0.36, 6.5); pool.position.set(-2, PODIUM_H + 0.19, 10.5); scene.add(pool);

// ---------- ground, plaza, roads ----------
const groundMat = new THREE.MeshStandardMaterial({ color: 0x2a2e33, roughness: 1 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), groundMat);
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const plazaMat = new THREE.MeshStandardMaterial({ color: 0x9c978d, roughness: 0.9 });
const plaza = new THREE.Mesh(BOX, plazaMat); plaza.scale.set(96, 0.2, 62); plaza.position.set(0, 0.1, 2); plaza.receiveShadow = true; scene.add(plaza);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x1c1f23, roughness: 0.95 });
function road(x, z, sx, sz) { const r = new THREE.Mesh(BOX, roadMat); r.scale.set(sx, 0.22, sz); r.position.set(x, 0.11, z); r.receiveShadow = true; scene.add(r); }
road(0, 46, 3000, 18); road(62, 0, 16, 3000);

// traffic light streaks (animated)
function streakTexture(colA, colB) {
  const c = document.createElement('canvas'); c.width = 8; c.height = 512;
  const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 8, 512);
  for (let i = 0; i < 46; i++) {
    const y = rng() * 512, len = 6 + rng() * 26;
    g.fillStyle = rng() < 0.8 ? colA : colB;
    g.fillRect(rng() < 0.5 ? 1 : 5, y, 2, len);
  }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const streaks = [];
function addStreak(x, y, z, len, alongZ, colA, colB, speed) {
  const tex = streakTexture(colA, colB); tex.repeat.set(1, len / 60);
  const mat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(3, 3, 3), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
  const geo = new THREE.PlaneGeometry(5, len); geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (!alongZ) m.rotation.y = Math.PI / 2;
  scene.add(m); streaks.push({ tex, mat, speed });
}
// elevated expressway (left side, like the reference mood)
const EX = -95, EY = 11;
const exMat = new THREE.MeshStandardMaterial({ color: 0x8d8f92, roughness: 0.85 });
const exDeck = new THREE.Mesh(BOX, exMat); exDeck.scale.set(28, 1.6, 3000); exDeck.position.set(EX, EY, 0); exDeck.castShadow = exDeck.receiveShadow = true; scene.add(exDeck);
const pillars = new THREE.InstancedMesh(BOX, exMat, 100);
for (let i = 0; i < 100; i++) pillars.setMatrixAt(i, boxMatrix(EX, EY / 2, -1500 + i * 30, 3, EY, 3));
scene.add(pillars);
addStreak(EX - 6, EY + 0.85, 0, 3000, true, '#fff3d6', '#ffd27a', 0.05);
addStreak(EX + 6, EY + 0.85, 0, 3000, true, '#ff3b2f', '#ff7a45', -0.04);
addStreak(0, 0.25, 42, 3000, false, '#fff3d6', '#ffd27a', 0.03);
addStreak(0, 0.25, 50, 3000, false, '#ff3b2f', '#ff7a45', -0.035);
addStreak(58, 0.25, 0, 3000, true, '#fff3d6', '#ffd27a', 0.035);
addStreak(66, 0.25, 0, 3000, true, '#ff3b2f', '#ff7a45', -0.03);

// street lights
const lampPos = [];
for (let x = -600; x <= 600; x += 22) { lampPos.push([x, 36.5]); lampPos.push([x, 55.5]); }
for (let z = -600; z <= 600; z += 22) { lampPos.push([52.5, z]); lampPos.push([71.5, z]); }
for (let z = -1400; z <= 1400; z += 30) { lampPos.push([EX - 13.5, z, EY + 5]); lampPos.push([EX + 13.5, z, EY + 5]); }
const lampMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.5, 1.1) });
const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.45, 8, 6), lampMat, lampPos.length);
lampPos.forEach(([x, z, y], i) => lamps.setMatrixAt(i, boxMatrix(x, y ?? 7, z, 1, 1, 1)));
scene.add(lamps);

// trees
const treePos = [];
for (let i = 0; i < 46; i++) treePos.push([-34 + rng() * 68, PODIUM_H + 0.3, 3 + rng() * 14, 0.9 + rng() * 0.8]);
for (let x = -46; x <= 46; x += 6) { treePos.push([x, 0.2, 31 + rng() * 2, 1.2 + rng() * 0.6]); }
for (let z = -28; z <= 30; z += 6) { treePos.push([-44 - rng() * 2, 0.2, z, 1.2 + rng() * 0.6]); treePos.push([45 + rng() * 2, 0.2, z, 1.2 + rng() * 0.6]); }
for (let x = -600; x <= 600; x += 14) { if (Math.abs(x) > 50) treePos.push([x + rng() * 4, 0.2, 33, 1 + rng() * 0.6]); }
const treeMat = new THREE.MeshStandardMaterial({ color: 0x2a4a2c, roughness: 0.95 });
const trees = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.8, 1), treeMat, treePos.length);
treePos.forEach(([x, y, z, s], i) => trees.setMatrixAt(i, boxMatrix(x, y + 1.6 * s + 1.2, z, s, s * 1.15, s)));
trees.castShadow = true; scene.add(trees);

// ---------- surrounding city ----------
const cityItems = [];
for (let i = 0; i < 900 && cityItems.length < 520; i++) {
  const ang = rng() * Math.PI * 2, rad = 75 + Math.pow(rng(), 0.7) * 820;
  const x = Math.cos(ang) * rad, z = Math.sin(ang) * rad;
  const w = 10 + rng() * 26, dd = 10 + rng() * 26;
  if (Math.abs(z - 46) < 9 + dd / 2 + 3) continue;
  if (Math.abs(x - 62) < 8 + w / 2 + 3) continue;
  if (Math.abs(x - EX) < 14 + w / 2 + 4) continue;
  if (Math.abs(x) < 52 + w / 2 && Math.abs(z) < 36 + dd / 2) continue;
  const tall = rng();
  const h = tall > 0.92 ? 70 + rng() * 90 : tall > 0.7 ? 30 + rng() * 40 : 7 + rng() * 22;
  cityItems.push({ x, z, w, d: dd, h, seed: rng() });
}
const cityGeo = BOX.clone();
cityGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(cityItems.map((c) => c.seed)), 1));
const cityMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.85 });
patchInstanced(cityMat, {
  vertDecl: 'attribute float aSeed; varying vec3 vWP; varying vec3 vWN; varying float vSeed;',
  vertMain: `mat4 cityIM = modelMatrix * instanceMatrix; vWP = (cityIM * vec4(transformed,1.0)).xyz; vWN = normalize(mat3(cityIM) * normal); vSeed = aSeed;`,
  fragDecl: 'varying vec3 vWP; varying vec3 vWN; varying float vSeed;',
  afterColor: `float isWall = 1.0 - step(0.5, abs(vWN.y));
    float hc = abs(vWN.x) > 0.5 ? vWP.z : vWP.x;
    vec2 g = vec2(hc / 3.4, vWP.y / 3.3); vec2 cell = floor(g); vec2 ff = fract(g);
    float win = step(0.18, ff.x) * step(ff.x, 0.82) * step(0.3, ff.y) * step(ff.y, 0.82) * isWall * step(3.0, vWP.y);
    float rnd = fract(sin(dot(cell + vSeed * 37.0, vec2(12.9898, 78.233))) * 43758.5453);
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.32, win);`,
  afterEmissive: `float lit = step(0.6, rnd);
    vec3 warm = mix(vec3(1.0, 0.68, 0.38), vec3(0.8, 0.88, 1.0), step(0.86, rnd));
    totalEmissiveRadiance += warm * lit * win * uNight * (0.18 + 0.35 * fract(rnd * 7.13));`,
});
const city = new THREE.InstancedMesh(cityGeo, cityMat, cityItems.length);
cityItems.forEach((c, i) => city.setMatrixAt(i, boxMatrix(c.x, c.h / 2, c.z, c.w, c.h, c.d)));
city.castShadow = true; city.receiveShadow = true; scene.add(city);

// ---------- post processing ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 0.7, 0.55, 0.85);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- state ----------
const state = { night: true, statusMode: false, cut: null, hovered: -1, selected: -1 };
const WARM = new THREE.Color(1.0, 0.56, 0.22);
const HOVER = new THREE.Color(0.55, 0.75, 1.0);
const SELECT = new THREE.Color(0.35, 0.6, 1.0);
const TINT_NIGHT = new THREE.Color(0.22, 0.27, 0.34);
const TINT_DAY = new THREE.Color(0.36, 0.46, 0.56);
const tmpC = new THREE.Color();
let pulse = 0;

function writeUnit(i) {
  const u = units[i];
  let e = tmpC.setRGB(0, 0, 0);
  let tint = state.night ? TINT_NIGHT : TINT_DAY;
  const showStatus = state.statusMode || (state.cut && state.cut.tower === u.tower && state.cut.floor === u.floor);
  if (showStatus) {
    const s = STATUS[u.status];
    e = tmpC.copy(s.color).multiplyScalar(s.k * (state.night ? 0.55 : 0.6));
  } else if (state.night && u.lit) {
    e = tmpC.copy(WARM).multiplyScalar(u.litK);
  }
  if (i === state.hovered) e = tmpC.copy(HOVER).multiplyScalar(1.1);
  if (i === state.selected) e = tmpC.copy(SELECT).multiplyScalar(2.2 + 1.2 * pulse);
  emitArr.set([e.r, e.g, e.b], i * 3);
  tintArr.set([tint.r, tint.g, tint.b], i * 3);
}
function refreshUnits(indices) {
  if (indices) indices.forEach((i) => i >= 0 && writeUnit(i));
  else for (let i = 0; i < units.length; i++) writeUnit(i);
  unitGeo.attributes.aEmit.needsUpdate = true;
  unitGeo.attributes.aTint.needsUpdate = true;
}

function applyCut() {
  const c = state.cut;
  for (const { mesh, items } of cuttables) {
    items.forEach((it, i) => mesh.setMatrixAt(i, c && it.tower === c.tower && it.floor > c.floor ? ZERO : it.m));
    mesh.instanceMatrix.needsUpdate = true;
  }
  for (const code in crowns) crowns[code].visible = !(c && c.tower === code);
  spine.visible = spineLight.visible = !c;
  refreshUnits();
}

function applyMood() {
  const n = state.night;
  uNight.value = n ? 1 : 0;
  if (n) {
    skyUniforms.top.value.set(0x0b1838); skyUniforms.mid.value.set(0x3c4d8c); skyUniforms.horizon.value.set(0xf09a78); skyUniforms.glow.value.set(0xff8a50).multiplyScalar(0.6);
    hemi.color.set(0x5a6aa0); hemi.groundColor.set(0x2a1d16); hemi.intensity = 0.9;
    sun.color.set(0xffa070); sun.intensity = 0.7; sun.position.set(-260, 60, -220); sun.castShadow = false;
    groundMat.color.set(0x23272c); scene.fog = new THREE.Fog(0x8a6f86, 260, 1500);
    lampMat.color.setRGB(2.2, 1.35, 0.55); bandMat.color.setRGB(0.95, 0.62, 0.32); spineLightMat.color.setRGB(1.4, 0.95, 0.55);
    lobbyMat.emissiveIntensity = 0.9; poolMat.emissiveIntensity = 0.7;
    streaks.forEach((s) => s.mat.color.setRGB(1.5, 1.5, 1.5));
    bloom.strength = 0.6; bloom.threshold = 0.82; bloom.radius = 0.45; renderer.toneMappingExposure = 0.9;
  } else {
    skyUniforms.top.value.set(0x3f7fc4); skyUniforms.mid.value.set(0x8fbde6); skyUniforms.horizon.value.set(0xe3edf5); skyUniforms.glow.value.set(0xfff4dd).multiplyScalar(0.25);
    hemi.color.set(0xd6e8ff); hemi.groundColor.set(0x6d6352); hemi.intensity = 1.25;
    sun.color.set(0xfff1dc); sun.intensity = 2.8; sun.position.set(160, 230, 140); sun.castShadow = true;
    groundMat.color.set(0x5d6656); scene.fog = new THREE.Fog(0xd3e2ee, 300, 1700);
    lampMat.color.setRGB(0.22, 0.22, 0.22); bandMat.color.setRGB(0.75, 0.75, 0.72); spineLightMat.color.setRGB(0.4, 0.42, 0.45);
    lobbyMat.emissiveIntensity = 0.15; poolMat.emissiveIntensity = 0.15;
    streaks.forEach((s) => s.mat.color.setRGB(0.1, 0.1, 0.1));
    bloom.strength = 0.12; bloom.threshold = 0.95; renderer.toneMappingExposure = 0.95;
  }
  if (envRT) envRT.dispose();
  envRT = pmrem.fromScene(envScene, 0, 0.1, 1000);
  scene.environment = envRT.texture;
  refreshUnits();
}

// ---------- UI ----------
const $ = (id) => document.getElementById(id);
const fmtM = (p) => (p / 1e6).toFixed(2) + ' ล้านบาท';
const fmtN = (n) => n.toLocaleString('th-TH');
const tooltip = $('tooltip'), panel = $('panel');

function updateStats() {
  const avail = units.filter((u) => u.status === 'available').length;
  $('stats').textContent = `ว่าง ${fmtN(avail)} จาก ${fmtN(units.length)} ห้อง`;
}
function statusBadge(u) { const s = STATUS[u.status]; return `<span class="badge" style="--c:${s.css}"><i></i>${s.label}${u.mine ? ' (คุณจอง · Demo)' : ''}</span>`; }

function showTooltip(i, x, y) {
  if (i < 0) { tooltip.hidden = true; return; }
  const u = units[i];
  tooltip.innerHTML = `<b>ห้อง ${u.id}</b><span>ชั้น ${u.floor} · ${u.type}</span><span>${u.area} ตร.ม. · ${u.bedrooms || 'สตูดิโอ'}${u.bedrooms ? ' นอน' : ''} · ${u.bathrooms} น้ำ</span><span class="price">${fmtM(u.price)}</span>${statusBadge(u)}`;
  tooltip.hidden = false;
  const r = container.getBoundingClientRect();
  const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
  let lx = x - r.left + 18, ly = y - r.top + 18;
  if (lx + tw > r.width - 8) lx = x - r.left - tw - 18;
  if (ly + th > r.height - 8) ly = y - r.top - th - 18;
  tooltip.style.transform = `translate(${lx}px, ${ly}px)`;
}

function renderPanel() {
  const i = state.selected;
  if (i < 0) { panel.classList.remove('open'); return; }
  const u = units[i];
  const canBook = u.status === 'available';
  panel.innerHTML = `
    <div class="panel-head"><div><p class="eyebrow">อาคาร ${u.tower} · ชั้น ${u.floor}</p><h2>ห้อง ${u.id}</h2></div>
      <button class="icon" id="closePanel" aria-label="ปิด">✕</button></div>
    ${statusBadge(u)}
    <p class="big-price">${fmtM(u.price)}</p>
    <p class="muted">${fmtN(Math.round(u.price / u.area))} บาท/ตร.ม.</p>
    <dl>
      <div><dt>ประเภท</dt><dd>${u.type}</dd></div>
      <div><dt>พื้นที่</dt><dd>${u.area} ตร.ม.</dd></div>
      <div><dt>ห้องนอน</dt><dd>${u.bedrooms || 'สตูดิโอ'}</dd></div>
      <div><dt>ห้องน้ำ</dt><dd>${u.bathrooms}</dd></div>
      <div><dt>ทิศ</dt><dd>${u.direction}</dd></div>
      <div><dt>ชั้น</dt><dd>${u.floor}</dd></div>
    </dl>
    <div class="actions">
      ${u.mine ? `<button class="btn ghost" id="unbook">ยกเลิกการจอง (Demo)</button>`
        : `<button class="btn primary" id="book" ${canBook ? '' : 'disabled'}>${canBook ? 'จองห้องนี้ (Demo)' : 'ห้องนี้ไม่ว่าง'}</button>`}
      <button class="btn ghost" id="goFloor">ดูทั้งชั้น ${u.floor}</button>
    </div>
    <p class="fine">การจองเป็นการสาธิตเท่านั้น บันทึกไว้ในเบราว์เซอร์นี้ ไม่มีการจองหรือขายจริง</p>`;
  panel.classList.add('open');
  $('closePanel').onclick = () => select(-1);
  $('goFloor').onclick = () => setCut({ tower: u.tower, floor: u.floor });
  if ($('book')) $('book').onclick = () => { u.status = 'reserved'; u.mine = true; saveMine(); afterBooking('จองห้อง ' + u.id + ' แล้ว (สาธิต)'); };
  if ($('unbook')) $('unbook').onclick = () => { u.status = u.baseStatus; u.mine = false; saveMine(); afterBooking('ยกเลิกการจองห้อง ' + u.id + ' แล้ว'); };
}
function afterBooking(msg) { refreshUnits([state.selected]); renderPanel(); updateStats(); toast(msg); }
let toastT;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400); }

function select(i) {
  const prev = state.selected; state.selected = i;
  refreshUnits([prev, i]); renderPanel();
}

// floor selector
const floorSel = $('floorSel');
floorSel.innerHTML = `<option value="">ทั้งโครงการ</option>` + TOWERS.map((t) => {
  let o = `<optgroup label="อาคาร ${t.code}">`;
  for (let f = t.last; f >= t.first; f--) o += `<option value="${t.code}:${f}">อาคาร ${t.code} · ชั้น ${f}</option>`;
  return o + '</optgroup>';
}).join('');
floorSel.onchange = () => {
  const v = floorSel.value;
  setCut(v ? { tower: v.split(':')[0], floor: +v.split(':')[1] } : null);
};

// camera tween
let tween = null;
function flyTo(pos, target) { tween = { t: 0, fromP: camera.position.clone(), fromT: controls.target.clone(), toP: pos, toT: target }; }
function setCut(c) {
  state.hovered = -1; tooltip.hidden = true;
  state.cut = c; floorSel.value = c ? `${c.tower}:${c.floor}` : '';
  controls.autoRotate = false;
  applyCut();
  if (c) {
    const t = TOWERS.find((x) => x.code === c.tower);
    const y = floorBaseY(t, c.floor) + FH;
    flyTo(new THREE.Vector3(t.cx + 30, y + 58, t.cz + 62), new THREE.Vector3(t.cx, y, t.cz));
    $('cutNote').hidden = false;
    $('cutNote').querySelector('span').textContent = `กำลังดูผังชั้น ${c.floor} อาคาร ${c.tower} — สีแสดงสถานะห้อง`;
  } else {
    flyTo(HOME.pos.clone(), HOME.target.clone());
    $('cutNote').hidden = true;
  }
}
$('clearCut').onclick = () => setCut(null);
$('resetView').onclick = () => { setCut(null); select(-1); };

function setMood(night) {
  state.night = night;
  $('btnNight').setAttribute('aria-pressed', night); $('btnDay').setAttribute('aria-pressed', !night);
  applyMood();
}
$('btnNight').onclick = () => setMood(true);
$('btnDay').onclick = () => setMood(false);
$('statusToggle').onchange = (e) => { state.statusMode = e.target.checked; $('legend').classList.toggle('show', state.statusMode); refreshUnits(); };

// ---------- picking ----------
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const blockers = [unitMesh, fillMesh, podium, spine];
let pointer = { dirty: false, x: 0, y: 0, type: 'mouse', inside: false };
let down = null;
function pick(cx, cy) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(blockers, false)[0];
  return hit && hit.object === unitMesh ? hit.instanceId : -1;
}
const el = renderer.domElement;
el.addEventListener('pointermove', (e) => { pointer = { dirty: true, x: e.clientX, y: e.clientY, type: e.pointerType, inside: true }; });
el.addEventListener('pointerleave', () => { pointer.inside = false; pointer.dirty = true; });
el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; controls.autoRotate = false; $('hint').classList.add('fade'); });
el.addEventListener('pointerup', (e) => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  down = null;
  if (moved > 6) return;
  const i = pick(e.clientX, e.clientY);
  select(i === state.selected ? -1 : i);
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') select(-1);
  if (state.selected < 0 || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) || e.target.tagName === 'SELECT') return;
  const u = units[state.selected];
  const df = e.key === 'ArrowUp' ? 1 : e.key === 'ArrowDown' ? -1 : 0;
  const dx = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
  const same = units.map((v, i) => [v, i]).filter(([v]) => v.tower === u.tower && v.row === u.row);
  let target;
  if (df) target = same.find(([v]) => v.floor === u.floor + df && Math.abs(v.x - u.x) < 0.01);
  else { const row = same.filter(([v]) => v.floor === u.floor).sort((a, b) => a[0].x - b[0].x); const k = row.findIndex(([, i]) => i === state.selected); target = row[k + dx]; }
  if (target) { e.preventDefault(); select(target[1]); }
});

// ---------- loop ----------
function onResize() {
  const w = container.clientWidth, h = container.clientHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h); composer.setSize(w, h); bloom.setSize(w, h);
}
addEventListener('resize', onResize);

const clock = new THREE.Clock();
function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (tween) {
    tween.t = Math.min(1, tween.t + dt / 0.9);
    const k = 1 - Math.pow(1 - tween.t, 3);
    camera.position.lerpVectors(tween.fromP, tween.toP, k);
    controls.target.lerpVectors(tween.fromT, tween.toT, k);
    if (tween.t >= 1) tween = null;
  }
  controls.update();
  streaks.forEach((s) => { s.tex.offset.y += s.speed * dt; });
  if (state.selected >= 0) { pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 4); refreshUnits([state.selected]); }
  if (pointer.dirty) {
    pointer.dirty = false;
    const i = pointer.inside && pointer.type === 'mouse' && !down ? pick(pointer.x, pointer.y) : -1;
    if (i !== state.hovered) { const prev = state.hovered; state.hovered = i; refreshUnits([prev, i]); el.style.cursor = i >= 0 ? 'pointer' : 'grab'; }
    showTooltip(i, pointer.x, pointer.y);
  }
  composer.render();
  requestAnimationFrame(loop);
}

applyMood();
applyCut();
updateStats();
requestAnimationFrame(loop);
window.__demo = { units, state, select, setCut, setMood, camera, controls, pickAt: pick, toggleStatus: (v) => { $('statusToggle').checked = v; $('statusToggle').onchange({ target: { checked: v } }); } };
