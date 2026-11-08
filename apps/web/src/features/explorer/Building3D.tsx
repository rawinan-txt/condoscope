import { floorBaseY, type Building, type UnitView } from '@condoscope/shared';
import { Environment, OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ACESFilmicToneMapping, InstancedMesh, Raycaster, Vector2, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import City from './scene/City';
import { homeView, projectBounds, towerMatrix, unitWorldCenter, type Bounds, type Vec3 } from './scene/layout';
import Site from './scene/Site';
import Sky from './scene/Sky';
import Towers from './scene/Towers';
import UnitTooltip from './UnitTooltip';
import type { CutFloor, ExplorerApi } from './useExplorer';

declare global {
  interface Window { __condoscope?: { projectUnit(id: number): { x: number; y: number } | null } }
}

export default function Building3D({ x, onUnavailable }: { x: ExplorerApi; onUnavailable(): void }) {
  const bounds = useMemo(() => projectBounds(x.buildings), [x.buildings]);
  const home = useMemo(() => homeView(bounds), [bounds]);
  const wrap = useRef<HTMLDivElement>(null);
  const [tipAt, setTipAt] = useState<{ left: number; top: number } | null>(null);
  const coarse = useMemo(() => matchMedia('(pointer: coarse)').matches, []);
  const hovered = x.unit(x.hoveredId);

  const onHover = (u: UnitView | null, e?: ThreeEvent<PointerEvent>) => {
    x.hover(u?.id ?? null);
    const r = wrap.current?.getBoundingClientRect();
    if (u && e && r) setTipAt({ left: Math.min(e.nativeEvent.clientX - r.left + 14, r.width - 216), top: e.nativeEvent.clientY - r.top + 14 });
    document.body.style.cursor = u ? 'pointer' : '';
  };
  useEffect(() => () => { document.body.style.cursor = ''; }, []);

  return (
    <div ref={wrap} className="relative h-full w-full overflow-hidden rounded-lg bg-[#16223d]">
      <Canvas
        shadows
        dpr={[1, coarse ? 1.5 : 2]}
        camera={{ fov: 38, near: 1, far: 5000, position: home.position }}
        gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onUnavailable(); })}
        onPointerMissed={() => x.hover(null)}
        aria-label="ตึก 3 มิติ ลากเพื่อหมุน เลื่อนล้อเพื่อซูม"
      >
        <Scene x={x} bounds={bounds} home={home} onHover={onHover} />
      </Canvas>
      {hovered && tipAt && <UnitTooltip unit={hovered} mine={x.mine} left={tipAt.left} top={tipAt.top} />}
    </div>
  );
}

function Scene({ x, bounds, home, onHover }: { x: ExplorerApi; bounds: Bounds; home: { position: Vec3; target: Vec3 }; onHover: (u: UnitView | null, e?: ThreeEvent<PointerEvent>) => void }) {
  const unitsRef = useRef<InstancedMesh>(null);
  const seed = x.buildings[0].project_id * 7919;
  return (
    <>
      <fog attach="fog" args={['#4b4766', 350, 1500]} />
      <Sky />
      <Environment resolution={128}><Sky radius={400} /></Environment>
      <hemisphereLight args={['#9fb3d9', '#202020', 0.55]} />
      <directionalLight
        castShadow
        position={[-220, 160, -260]}
        intensity={1.1}
        color="#ffc999"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-camera-far={800}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
      <Site r={bounds} seed={seed} />
      <City r={bounds} seed={seed} />
      <Towers x={x} unitsRef={unitsRef} onHover={onHover} onPick={(u) => x.select(u.id)} />
      <CameraRig x={x} home={home} bounds={bounds} />
      <Probe x={x} unitsRef={unitsRef} />
      <EffectComposer multisampling={4}>
        <Bloom intensity={0.7} luminanceThreshold={0.85} luminanceSmoothing={0.3} mipmapBlur />
      </EffectComposer>
    </>
  );
}

/** Orbit controls plus a smooth move to the home view or to a cut floor. Stops as soon as the user drags. */
function CameraRig({ x, home, bounds }: { x: ExplorerApi; home: { position: Vec3; target: Vec3 }; bounds: Bounds }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const goal = useRef<{ pos: Vector3; target: Vector3 } | null>(null);
  const camera = useThree((s) => s.camera);

  const { cutFloor, buildings } = x;
  useEffect(() => { goal.current = viewFor(cutFloor, buildings, home); }, [cutFloor, buildings, home]);

  useFrame((_, dt) => {
    const g = goal.current;
    const c = controls.current;
    if (!g || !c) return;
    const k = 1 - Math.exp(-dt * 4);
    camera.position.lerp(g.pos, k);
    c.target.lerp(g.target, k);
    c.update();
    if (camera.position.distanceTo(g.pos) < 0.5) goal.current = null;
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={home.target}
      enableDamping
      dampingFactor={0.08}
      minDistance={35}
      maxDistance={Math.max(520, bounds.top * 5)}
      maxPolarAngle={Math.PI * 0.49}
      onStart={() => { goal.current = null; }}
    />
  );
}

function viewFor(cut: CutFloor, buildings: Building[], home: { position: Vec3; target: Vec3 }) {
  if (!cut) return { pos: new Vector3(...home.position), target: new Vector3(...home.target) };
  const b = buildings.find((v) => v.id === cut.building_id)!;
  const y = floorBaseY(b, cut.floor) + b.floor_height_m;
  const center = new Vector3(0, y, 0).applyMatrix4(towerMatrix(b));
  return { pos: center.clone().add(new Vector3(18, 55, 38)), target: center };
}

/**
 * Test hook: screen position of a unit centre (used by the Playwright success-criterion test).
 * Returns null when the unit is off screen or hidden behind another unit.
 */
function Probe({ x, unitsRef }: { x: ExplorerApi; unitsRef: React.RefObject<InstancedMesh | null> }) {
  const { camera, gl } = useThree();
  useEffect(() => {
    const ray = new Raycaster();
    window.__condoscope = {
      projectUnit(id) {
        const u = x.unit(id);
        const b = u && x.buildings.find((v) => v.id === u.building_id);
        const mesh = unitsRef.current;
        if (!u || !b || !mesh || !x.isVisible(u)) return null;
        const ndc = unitWorldCenter(b, u).project(camera);
        if (Math.abs(ndc.x) > 0.95 || Math.abs(ndc.y) > 0.95 || ndc.z > 1) return null;
        const r = gl.domElement.getBoundingClientRect();
        // the unit must cover a few pixels around its centre, so a click there cannot land on a neighbour
        const px = 3;
        for (const [dx, dy] of [[0, 0], [px, 0], [-px, 0], [0, px], [0, -px]]) {
          ray.setFromCamera(new Vector2(ndc.x + (2 * dx) / r.width, ndc.y + (2 * dy) / r.height), camera);
          const hit = ray.intersectObject(mesh).find((h) => h.instanceId !== undefined && x.isVisible(x.units[h.instanceId]));
          if (!hit || x.units[hit.instanceId!].id !== id) return null;
        }
        return { x: r.left + ((ndc.x + 1) / 2) * r.width, y: r.top + ((1 - ndc.y) / 2) * r.height };
      },
    };
    return () => { delete window.__condoscope; };
  }, [x, camera, gl, unitsRef]);
  return null;
}
