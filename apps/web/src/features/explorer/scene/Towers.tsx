import { floorBaseY, unitBox, buildingWidth, type Building, type UnitView } from '@condoscope/shared';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  BoxGeometry, Color, InstancedBufferAttribute, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3,
} from 'three';
import { unitColorRole } from '../status';
import type { CutFloor, ExplorerApi } from '../useExplorer';
import { interiorGlassMaterial } from './interiorMaterial';
import { BALCONY_D, towerMatrix, towerTop } from './layout';

const BOX = new BoxGeometry(1, 1, 1);
const ZERO = new Matrix4().makeScale(0, 0, 0);
const Q = new Quaternion();

interface Item { building_id: number; floor: number; m: Matrix4 }
const local = (x: number, y: number, z: number, sx: number, sy: number, sz: number) =>
  new Matrix4().compose(new Vector3(x, y, z), Q, new Vector3(sx, sy, sz));

const concrete = new MeshStandardMaterial({ color: 0xe4dfd6, roughness: 0.75 });
const interior = new MeshStandardMaterial({ color: 0x16191e, roughness: 0.9 });
const rail = new MeshStandardMaterial({ color: 0xb8c7d4, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.35, depthWrite: false });
const roofMech = new MeshStandardMaterial({ color: 0x2a3038, roughness: 0.6 });
const frame = new MeshStandardMaterial({ color: 0x2b3138, roughness: 0.35, metalness: 0.7 });
const panel = new MeshStandardMaterial({ color: 0x3a4048, roughness: 0.6 });
const finMat = new MeshStandardMaterial({ color: 0xd9d4cb, roughness: 0.7 });

const TINT = new Color(0.16, 0.2, 0.26);
const TINT_DIM = new Color(0.1, 0.12, 0.15);
const BLACK = new Color(0, 0, 0);
/** Same "lights on" pattern on every visit: hash of the unit id. */
const hash = (n: number) => { const h = Math.sin(n * 12.9898) * 43758.5453; return h - Math.floor(h); };
const litK = (id: number) => { const f = hash(id); return f < 0.62 ? 0.7 + f * 0.6 : 0; };

function hideAbove(mesh: InstancedMesh | null, items: Item[], cut: CutFloor) {
  if (!mesh) return;
  items.forEach((it, i) => mesh.setMatrixAt(i, cut && it.building_id === cut.building_id && it.floor > cut.floor ? ZERO : it.m));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
}

interface Props {
  x: ExplorerApi;
  onHover(u: UnitView | null, e?: ThreeEvent<PointerEvent>): void;
  onPick(u: UnitView): void;
  unitsRef: React.RefObject<InstancedMesh | null>;
}

export default function Towers({ x, onHover, onPick, unitsRef }: Props) {
  const { units, buildings, cutFloor } = x;
  const byId = useMemo(() => new Map(buildings.map((b) => [b.id, b])), [buildings]);

  const built = useMemo(() => {
    const unitItems: Item[] = [], slabs: Item[] = [], fills: Item[] = [], balconies: Item[] = [], rails: Item[] = [];
    const mullions: Item[] = [], spandrels: Item[] = [], railTops: Item[] = [], fins: Item[] = [];
    for (const u of units) {
      const b = byId.get(u.building_id)!;
      const T = towerMatrix(b);
      const box = unitBox(b, u);
      const s = u.facade === 'front' ? 1 : -1;
      const base = floorBaseY(b, u.floor_number);
      const edge = b.footprint_depth_m / 2;
      const f = { building_id: b.id, floor: u.floor_number };
      unitItems.push({ ...f, m: T.clone().multiply(local(box.x, box.y, box.z, box.w - 0.24, box.h - 0.44, box.d - 0.1)) });
      balconies.push({ ...f, m: T.clone().multiply(local(box.x, base + 0.08, s * (edge + BALCONY_D / 2), box.w - 0.35, 0.18, BALCONY_D)) });
      rails.push({ ...f, m: T.clone().multiply(local(box.x, base + 0.65, s * (edge + BALCONY_D - 0.02), box.w - 0.35, 1.05, 0.05)) });
      railTops.push({ ...f, m: T.clone().multiply(local(box.x, base + 1.2, s * (edge + BALCONY_D - 0.02), box.w - 0.35, 0.06, 0.09)) });
      // window frame: centre mullion, plus a solid spandrel panel along the sill
      const face = s * (edge - 0.04);
      mullions.push({ ...f, m: T.clone().multiply(local(box.x, box.y, face, 0.09, box.h - 0.44, 0.14)) });
      spandrels.push({ ...f, m: T.clone().multiply(local(box.x, base + 0.62, face, box.w - 0.24, 0.5, 0.12)) });
    }
    for (const b of buildings) {
      const T = towerMatrix(b);
      const W = buildingWidth(b);
      for (let floor = b.first_res_floor; floor <= b.last_res_floor + 1; floor++) {
        const y = floorBaseY(b, floor);
        slabs.push({ building_id: b.id, floor, m: T.clone().multiply(local(0, y, 0, W + 0.5, 0.44, b.footprint_depth_m + 0.5)) });
        if (floor <= b.last_res_floor) {
          // vertical fins on every bay boundary of both facades
          let acc = -W / 2;
          for (const edgeX of [acc, ...b.unit_bay_widths.map((w) => (acc += w))]) {
            for (const sd of [1, -1]) fins.push({ building_id: b.id, floor, m: T.clone().multiply(local(edgeX, y + b.floor_height_m / 2, sd * (b.footprint_depth_m / 2 + 0.45), 0.28, b.floor_height_m, 0.9)) });
          }
        }
        if (floor <= b.last_res_floor) fills.push({ building_id: b.id, floor, m: T.clone().multiply(local(0, y + (b.floor_height_m - 0.7) / 2, 0, W - 0.3, b.floor_height_m - 0.7, b.footprint_depth_m - 0.3)) });
      }
    }
    const geo = BOX.clone();
    geo.setAttribute('aEmit', new InstancedBufferAttribute(new Float32Array(units.length * 3), 3));
    geo.setAttribute('aLit', new InstancedBufferAttribute(new Float32Array(units.length), 1));
    geo.setAttribute('aSeed', new InstancedBufferAttribute(Float32Array.from(units, (u) => hash(u.id * 7.13)), 1));
    return { unitItems, slabs, fills, balconies, rails, mullions, spandrels, railTops, fins, geo, glass: interiorGlassMaterial() };
  }, [units, buildings, byId]);

  const slabRef = useRef<InstancedMesh>(null);
  const fillRef = useRef<InstancedMesh>(null);
  const balcRef = useRef<InstancedMesh>(null);
  const railRef = useRef<InstancedMesh>(null);
  const mullRef = useRef<InstancedMesh>(null);
  const spanRef = useRef<InstancedMesh>(null);
  const railTopRef = useRef<InstancedMesh>(null);
  const finRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    hideAbove(unitsRef.current, built.unitItems, cutFloor);
    hideAbove(slabRef.current, built.slabs, cutFloor);
    hideAbove(fillRef.current, built.fills, cutFloor);
    hideAbove(balcRef.current, built.balconies, cutFloor);
    hideAbove(railRef.current, built.rails, cutFloor);
    hideAbove(mullRef.current, built.mullions, cutFloor);
    hideAbove(spanRef.current, built.spandrels, cutFloor);
    hideAbove(railTopRef.current, built.railTops, cutFloor);
    hideAbove(finRef.current, built.fins, cutFloor);
  }, [built, cutFloor, unitsRef]);

  // colours: only instances whose role changed are rewritten
  const last = useRef<string[]>([]);
  useEffect(() => {
    const mesh = unitsRef.current;
    if (!mesh) return;
    const emit = built.geo.getAttribute('aEmit') as InstancedBufferAttribute;
    const lit = built.geo.getAttribute('aLit') as InstancedBufferAttribute;
    let dirty = false;
    const c = new Color();
    units.forEach((u, i) => {
      const role = unitColorRole(x, u);
      const key = `${role.kind}|${role.color}`;
      if (last.current[i] === key) return;
      last.current[i] = key;
      dirty = true;
      let tint = TINT;
      let on = 0;
      if (role.kind === 'idle') { c.copy(BLACK); on = litK(u.id); }
      else if (role.kind === 'dim') { c.copy(BLACK); tint = TINT_DIM; }
      else c.set(role.color).multiplyScalar(role.kind === 'selected' ? 2.2 : role.kind === 'hovered' ? 1.6 : 1.0);
      emit.setXYZ(i, c.r, c.g, c.b);
      lit.setX(i, on);
      mesh.setColorAt(i, tint);
    });
    if (dirty) { emit.needsUpdate = true; lit.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; }
  }, [x, units, built, unitsRef]);

  const pick = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    // the first visible unit along the ray (hidden floors are skipped)
    for (const hit of e.intersections) {
      if (hit.object !== unitsRef.current || hit.instanceId === undefined) continue;
      const u = units[hit.instanceId];
      if (u && x.isVisible(u)) return u;
    }
    return null;
  };

  return (
    <group>
      <instancedMesh
        ref={unitsRef}
        args={[built.geo, built.glass, units.length]}
        castShadow
        receiveShadow
        onPointerMove={(e) => { if (e.pointerType !== 'mouse') return; e.stopPropagation(); onHover(pick(e), e); }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => { if (e.delta > 5) return; const u = pick(e); if (u) { e.stopPropagation(); onPick(u); } }}
      />
      <instancedMesh ref={slabRef} args={[BOX, concrete, built.slabs.length]} castShadow receiveShadow />
      <instancedMesh ref={fillRef} args={[BOX, interior, built.fills.length]} />
      <instancedMesh ref={balcRef} args={[BOX, concrete, built.balconies.length]} castShadow receiveShadow />
      <instancedMesh ref={railRef} args={[BOX, rail, built.rails.length]} />
      <instancedMesh ref={railTopRef} args={[BOX, frame, built.railTops.length]} />
      <instancedMesh ref={mullRef} args={[BOX, frame, built.mullions.length]} />
      <instancedMesh ref={spanRef} args={[BOX, panel, built.spandrels.length]} receiveShadow />
      <instancedMesh ref={finRef} args={[BOX, finMat, built.fins.length]} castShadow receiveShadow />
      {buildings.map((b) => <Crown key={b.id} b={b} />)}
    </group>
  );
}

/** Roof: mechanical box plus a frame on the tallest tower. */
function Crown({ b }: { b: Building }) {
  const W = buildingWidth(b);
  const top = towerTop(b);
  const m = towerMatrix(b);
  const pos = new Vector3().setFromMatrixPosition(m);
  return (
    <group position={pos} rotation={[0, (-b.rotation_deg * Math.PI) / 180, 0]}>
      <mesh geometry={BOX} material={roofMech} position={[0, top + 2, 0]} scale={[W * 0.55, 4, b.footprint_depth_m * 0.6]} castShadow />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={BOX} material={concrete} position={[0, top + 6.5, s * (b.footprint_depth_m / 2)]} scale={[W, 0.6, 0.7]} castShadow />
      ))}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} geometry={BOX} material={concrete} position={[sx * W / 2, top + 3.4, sz * b.footprint_depth_m / 2]} scale={[0.7, 6.8, 0.7]} castShadow />
      )))}
    </group>
  );
}
