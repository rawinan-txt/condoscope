import { mulberry32 } from '@condoscope/shared';
import { useFrame } from '@react-three/fiber';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  AdditiveBlending, BoxGeometry, CanvasTexture, Color, Matrix4, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry,
  Quaternion, RepeatWrapping, SphereGeometry, SRGBColorSpace, Vector3,
} from 'three';
import { occludesFloorView, type Bounds } from './layout';
import { uNight, type TimeOfDay } from './time';

const BOX = new BoxGeometry(1, 1, 1);
const Q = new Quaternion();
const mat = (x: number, y: number, z: number, sx: number, sy: number, sz: number) => new Matrix4().compose(new Vector3(x, y, z), Q, new Vector3(sx, sy, sz));

const cityMat = new MeshStandardMaterial({ color: 0x6f757d, roughness: 0.85 });
// window grid on every wall, some windows lit (own shader patch)
cityMat.onBeforeCompile = (s) => {
  s.uniforms.uNight = uNight;
  s.vertexShader = s.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vCityP;\nvarying vec3 vCityN;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nmat4 cityM = modelMatrix * instanceMatrix; vCityP = (cityM * vec4(transformed, 1.0)).xyz; vCityN = normalize(mat3(cityM) * normal);');
  s.fragmentShader = s.fragmentShader
    .replace('#include <common>', '#include <common>\nuniform float uNight;\nvarying vec3 vCityP;\nvarying vec3 vCityN;\nfloat cityWin; float cityRnd;')
    .replace('#include <color_fragment>', `#include <color_fragment>
      float wall = 1.0 - step(0.5, abs(vCityN.y));
      float along = abs(vCityN.x) > 0.5 ? vCityP.z : vCityP.x;
      vec2 g = vec2(along / 3.4, vCityP.y / 3.3); vec2 cell = floor(g); vec2 f = fract(g);
      cityWin = step(0.2, f.x) * step(f.x, 0.8) * step(0.3, f.y) * step(f.y, 0.82) * wall * step(3.0, vCityP.y);
      cityRnd = fract(sin(dot(cell + floor(vCityP.xz / 40.0), vec2(12.9898, 78.233))) * 43758.5453);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.3, cityWin);`)
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      totalEmissiveRadiance += mix(vec3(1.0, 0.68, 0.38), vec3(0.8, 0.88, 1.0), step(0.86, cityRnd)) * step(0.6, cityRnd) * cityWin * 0.22 * (0.1 + 0.9 * uNight);`);
};
const roadMat = new MeshStandardMaterial({ color: 0x1c1f23, roughness: 0.95 });
const exMat = new MeshStandardMaterial({ color: 0x8d8f92, roughness: 0.85 });
const lampDusk = new MeshBasicMaterial({ color: new Color(4, 2.5, 1.1) });
const lampDay = new MeshBasicMaterial({ color: new Color(0.55, 0.55, 0.5) });
const LAMP = new SphereGeometry(0.45, 8, 6);

function streakTexture(rng: () => number, a: string, b: string) {
  const c = document.createElement('canvas');
  c.width = 8; c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000'; g.fillRect(0, 0, 8, 512);
  for (let i = 0; i < 46; i++) {
    g.fillStyle = rng() < 0.8 ? a : b;
    g.fillRect(rng() < 0.5 ? 1 : 5, rng() * 512, 2, 6 + rng() * 26);
  }
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.colorSpace = SRGBColorSpace;
  return t;
}

export interface FloorFocus { camera: Vector3; target: Vector3; clearance: number }
const NONE: ReadonlySet<number> = new Set();
const FADED_OPACITY = 0.12;

/**
 * Surrounding city, roads with moving car lights and an elevated expressway, laid out around the project bounds.
 * While a floor is in focus the blocks between the camera and that floor fade out (and fade back afterwards).
 */
export default memo(function City({ r, seed, time, focus, reducedMotion }: { r: Bounds; seed: number; time: TimeOfDay; focus: FloorFocus | null; reducedMotion: boolean }) {
  const cx = (r.minX + r.maxX) / 2;
  const roadZ = r.maxZ + 22;
  const roadX = r.maxX + 24;
  const exX = r.minX - 45;
  const exY = 11;

  const { blocks, lamps, streaks } = useMemo(() => {
    const rng = mulberry32(seed);
    const blocks: Matrix4[] = [];
    for (let i = 0; i < 900 && blocks.length < 520; i++) {
      const ang = rng() * Math.PI * 2;
      const rad = 75 + Math.pow(rng(), 0.7) * 820;
      const x = cx + Math.cos(ang) * rad, z = Math.sin(ang) * rad;
      const w = 10 + rng() * 26, d = 10 + rng() * 26;
      const tall = rng();
      const h = tall > 0.92 ? 70 + rng() * 90 : tall > 0.7 ? 30 + rng() * 40 : 7 + rng() * 22;
      if (Math.abs(z - roadZ) < 9 + d / 2 + 3 || Math.abs(x - roadX) < 8 + w / 2 + 3 || Math.abs(x - exX) < 14 + w / 2 + 4) continue;
      if (x + w / 2 > r.minX - 16 && x - w / 2 < r.maxX + 16 && z + d / 2 > r.minZ - 16 && z - d / 2 < r.maxZ + 16) continue;
      // keep the line of sight from the home camera (south-east) clear
      const toCam = Math.atan2(z - (r.minZ + r.maxZ) / 2, x - cx) - Math.atan2(0.72, 0.62);
      if (Math.abs(Math.atan2(Math.sin(toCam), Math.cos(toCam))) < 0.6 && rad < 340 && h > 20) continue;
      blocks.push(mat(x, h / 2, z, w, h, d));
    }
    const lamps: Matrix4[] = [];
    for (let x = cx - 600; x <= cx + 600; x += 22) { lamps.push(mat(x, 7, roadZ - 9.5, 1, 1, 1)); lamps.push(mat(x, 7, roadZ + 9.5, 1, 1, 1)); }
    for (let z = -600; z <= 600; z += 22) { lamps.push(mat(roadX - 9.5, 7, z, 1, 1, 1)); lamps.push(mat(roadX + 9.5, 7, z, 1, 1, 1)); }
    const mk = (x: number, y: number, z: number, alongZ: boolean, a: string, b: string, speed: number) => {
      const tex = streakTexture(rng, a, b);
      tex.repeat.set(1, 3000 / 60);
      return { x, y, z, alongZ, speed, mat: new MeshBasicMaterial({ map: tex, color: new Color(1.6, 1.6, 1.6), blending: AdditiveBlending, transparent: true, depthWrite: false }) };
    };
    const streaks = [
      mk(exX - 6, exY + 0.85, 0, true, '#fff3d6', '#ffd27a', 0.05), mk(exX + 6, exY + 0.85, 0, true, '#ff3b2f', '#ff7a45', -0.04),
      mk(cx, 0.25, roadZ - 4, false, '#fff3d6', '#ffd27a', 0.03), mk(cx, 0.25, roadZ + 4, false, '#ff3b2f', '#ff7a45', -0.035),
      mk(roadX - 4, 0.25, 0, true, '#fff3d6', '#ffd27a', 0.035), mk(roadX + 4, 0.25, 0, true, '#ff3b2f', '#ff7a45', -0.03),
    ];
    return { blocks, lamps, streaks };
  }, [seed, cx, r, roadZ, roadX, exX]);

  const strip = useMemo(() => new PlaneGeometry(5, 3000).rotateX(-Math.PI / 2), []);

  // blocks that hide the focused floor, drawn with a see-through material; kept until they have faded back in
  const boxes = useMemo(() => blocks.map((m) => {
    const p = new Vector3().setFromMatrixPosition(m), sc = new Vector3().setFromMatrixScale(m).multiplyScalar(0.5);
    return { min: p.clone().sub(sc), max: p.clone().add(sc) };
  }), [blocks]);
  const hiding = useMemo(() => (focus ? new Set(boxes.flatMap((b, i) => (occludesFloorView(focus.camera, focus.target, b, focus.clearance) ? [i] : []))) : NONE), [boxes, focus]);
  const [faded, setFaded] = useState<ReadonlySet<number>>(NONE);
  useEffect(() => { if (hiding.size) setFaded(hiding); }, [hiding]);
  const opacity = useRef(1);
  const ghostMat = useMemo(() => {
    const m = new MeshStandardMaterial({ color: 0x6f757d, roughness: 0.85, transparent: true, depthWrite: false });
    m.onBeforeCompile = cityMat.onBeforeCompile; // same window grid
    return m;
  }, []);
  const { solid, ghost } = useMemo(() => ({ solid: blocks.filter((_, i) => !faded.has(i)), ghost: blocks.filter((_, i) => faded.has(i)) }), [blocks, faded]);

  useFrame((_, dt) => {
    for (const s of streaks) { s.mat.map!.offset.y += s.speed * dt * 10; s.mat.opacity = 0.3 + 0.7 * uNight.value; }
    const goal = focus ? FADED_OPACITY : 1;
    opacity.current = reducedMotion ? goal : opacity.current + (goal - opacity.current) * (1 - Math.exp(-dt * 6));
    ghostMat.opacity = opacity.current;
    if (!focus && faded.size && opacity.current > 0.99) setFaded(NONE);
  });

  const fill = (list: Matrix4[]) => (m: import('three').InstancedMesh | null) => {
    if (!m) return;
    list.forEach((t, i) => m.setMatrixAt(i, t));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  };

  return (
    <group>
      <instancedMesh key={`solid-${solid.length}`} args={[BOX, cityMat, solid.length]} ref={fill(solid)} castShadow receiveShadow />
      {ghost.length > 0 && <instancedMesh key={`ghost-${ghost.length}`} args={[BOX, ghostMat, ghost.length]} ref={fill(ghost)} receiveShadow />}
      <mesh geometry={BOX} material={roadMat} position={[cx, 0.11, roadZ]} scale={[3000, 0.22, 18]} receiveShadow />
      <mesh geometry={BOX} material={roadMat} position={[roadX, 0.11, 0]} scale={[16, 0.22, 3000]} receiveShadow />
      <mesh geometry={BOX} material={exMat} position={[exX, exY, 0]} scale={[28, 1.6, 3000]} castShadow receiveShadow />
      <instancedMesh args={[BOX, exMat, 100]} ref={fill(Array.from({ length: 100 }, (_, i) => mat(exX, exY / 2, -1500 + i * 30, 3, exY, 3)))} />
      <instancedMesh args={[LAMP, time === 'dusk' ? lampDusk : lampDay, lamps.length]} ref={fill(lamps)} />
      {streaks.map((s, i) => (
        <mesh key={i} geometry={strip} material={s.mat} position={[s.x, s.y, s.z]} rotation={[0, s.alongZ ? 0 : Math.PI / 2, 0]} />
      ))}
    </group>
  );
});
