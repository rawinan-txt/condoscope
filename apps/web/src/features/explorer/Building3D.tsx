import { floorBaseY, type Building, type UnitView } from '@condoscope/shared';
import { Environment, OrbitControls, PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, SSAO } from '@react-three/postprocessing';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ACESFilmicToneMapping, InstancedMesh, Raycaster, Vector2, Vector3, type Camera } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import City from './scene/City';
import { homeView, projectBounds, towerMatrix, unitViewGoal, unitWorldCenter, type Bounds, type Vec3 } from './scene/layout';
import Landscape from './scene/Landscape';
import Site from './scene/Site';
import Sky from './scene/Sky';
import { LOOK, uNight, type TimeOfDay } from './scene/time';
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
  const [low, setLow] = useState(coarse); // phones start in low quality; desktops drop to it when FPS stays < 40
  const [time, setTime] = useState<TimeOfDay>('dusk');
  useEffect(() => { uNight.value = time === 'dusk' ? 1 : 0; }, [time]);
  const hovered = x.unit(x.hoveredId);

  const onHover = (u: UnitView | null, e?: ThreeEvent<PointerEvent>) => {
    x.hover(u?.id ?? null);
    const r = wrap.current?.getBoundingClientRect();
    if (u && e && r) setTipAt({ left: Math.min(e.nativeEvent.clientX - r.left + 14, r.width - 216), top: e.nativeEvent.clientY - r.top + 14 });
    document.body.style.cursor = u ? 'pointer' : '';
  };
  useEffect(() => () => { document.body.style.cursor = ''; }, []);

  return (
    <div ref={wrap} className="relative h-full w-full overflow-hidden rounded-lg" style={{ background: LOOK[time].bg }}>
      <Canvas
        shadows="percentage"
        dpr={[1, low ? 1.25 : 2]}
        camera={{ fov: 38, near: 1, far: 5000, position: home.position }}
        gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onUnavailable(); })}
        onPointerMissed={() => x.hover(null)}
        aria-label="ตึก 3 มิติ ลากเพื่อหมุน เลื่อนล้อเพื่อซูม"
      >
        <Scene x={x} bounds={bounds} home={home} onHover={onHover} time={time} low={low} onSlow={() => setLow(true)} />
      </Canvas>
      <div className="absolute right-2 top-2 flex rounded-md bg-white/90 p-0.5 text-sm shadow" role="group" aria-label="ช่วงเวลา">
        {(['dusk', 'day'] as const).map((t) => (
          <button key={t} type="button" aria-pressed={time === t} onClick={() => setTime(t)} className={`rounded px-2.5 py-1 ${time === t ? 'bg-accent text-white' : 'hover:bg-slate-100'}`}>
            {t === 'dusk' ? 'พลบค่ำ' : 'กลางวัน'}
          </button>
        ))}
      </div>
      {hovered && tipAt && <UnitTooltip unit={hovered} mine={x.mine} left={tipAt.left} top={tipAt.top} />}
    </div>
  );
}

interface SceneProps {
  x: ExplorerApi; bounds: Bounds; home: { position: Vec3; target: Vec3 };
  onHover: (u: UnitView | null, e?: ThreeEvent<PointerEvent>) => void;
  time: TimeOfDay; low: boolean; onSlow(): void;
}

function Scene({ x, bounds, home, onHover, time, low, onSlow }: SceneProps) {
  const unitsRef = useRef<InstancedMesh>(null);
  const seed = x.buildings[0].project_id * 7919;
  const look = LOOK[time];
  return (
    <>
      <PerformanceMonitor ms={250} iterations={8} bounds={() => [40, 1000]} onDecline={onSlow} />
      <fog attach="fog" args={[look.fog, time === 'day' ? 600 : 350, time === 'day' ? 2600 : 1500]} />
      <Sky time={time} />
      {/* own Suspense: the scene draws right away and the HDRI lighting joins when loaded */}
      <Suspense fallback={null}>
        <Environment files={import.meta.env.BASE_URL + look.env} environmentIntensity={look.envIntensity} />
      </Suspense>
      <hemisphereLight args={look.hemi} />
      <directionalLight
        key={low ? 'low' : 'high'}
        castShadow
        position={look.sun.position}
        intensity={look.sun.intensity}
        color={look.sun.color}
        shadow-mapSize={low ? [1024, 1024] : [2048, 2048]}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-camera-far={800}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-radius={3}
      />
      <Site r={bounds} seed={seed} />
      <Landscape r={bounds} seed={seed} time={time} />
      <City r={bounds} seed={seed} time={time} />
      <Towers x={x} unitsRef={unitsRef} onHover={onHover} onPick={(u) => x.select(u.id)} />
      <CameraRig x={x} home={home} bounds={bounds} unitsRef={unitsRef} />
      <Probe x={x} unitsRef={unitsRef} />
      {low ? (
        <EffectComposer key="low" multisampling={0}>
          <Bloom intensity={time === 'dusk' ? 0.7 : 0.25} luminanceThreshold={0.85} luminanceSmoothing={0.3} mipmapBlur />
        </EffectComposer>
      ) : (
        <EffectComposer key="high" multisampling={4} enableNormalPass>
          <SSAO samples={16} radius={0.12} intensity={18} luminanceInfluence={0.6} worldDistanceThreshold={60} worldDistanceFalloff={20} worldProximityThreshold={1} worldProximityFalloff={0.5} />
          <Bloom intensity={time === 'dusk' ? 0.7 : 0.25} luminanceThreshold={0.85} luminanceSmoothing={0.3} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
}

/** Orbit controls plus a smooth move to the home view or to a cut floor. Stops as soon as the user drags. */
function CameraRig({ x, home, bounds, unitsRef }: { x: ExplorerApi; home: { position: Vec3; target: Vec3 }; bounds: Bounds; unitsRef: React.RefObject<InstancedMesh | null> }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const goal = useRef<{ pos: Vector3; target: Vector3 } | null>(null);
  const { camera, gl } = useThree();

  const { cutFloor, buildings, selectedId } = x;
  useEffect(() => { goal.current = viewFor(cutFloor, buildings, home); }, [cutFloor, buildings, home]);
  // a unit picked from the list or keyboard may be out of sight (e.g. back facade): bring it into view
  useEffect(() => {
    if (selectedId === null || screenPoint(x, selectedId, unitsRef.current, camera, gl.domElement.getBoundingClientRect(), 0)) return;
    const u = x.unit(selectedId)!;
    const v = unitViewGoal(x.buildings.find((b) => b.id === u.building_id)!, u);
    goal.current = { pos: new Vector3(...v.position), target: new Vector3(...v.target) };
  }, [selectedId]); // only a new selection should move the camera, not every re-render

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
 * Screen position of a unit centre, or null when it is off screen, on a cut-away floor or hidden behind
 * another unit. With px > 0 the unit must also cover px pixels around its centre (so a click cannot land on a neighbour).
 */
function screenPoint(x: ExplorerApi, id: number, mesh: InstancedMesh | null, camera: Camera, rect: DOMRect, px: number) {
  const u = x.unit(id);
  const b = u && x.buildings.find((v) => v.id === u.building_id);
  if (!u || !b || !mesh || !x.isVisible(u)) return null;
  const ndc = unitWorldCenter(b, u).project(camera);
  if (Math.abs(ndc.x) > 0.95 || Math.abs(ndc.y) > 0.95 || ndc.z > 1) return null;
  const ray = new Raycaster();
  for (const [dx, dy] of px ? [[0, 0], [px, 0], [-px, 0], [0, px], [0, -px]] : [[0, 0]]) {
    ray.setFromCamera(new Vector2(ndc.x + (2 * dx) / rect.width, ndc.y + (2 * dy) / rect.height), camera);
    const hit = ray.intersectObject(mesh).find((h) => h.instanceId !== undefined && x.isVisible(x.units[h.instanceId]));
    if (!hit || x.units[hit.instanceId!].id !== id) return null;
  }
  return { x: rect.left + ((ndc.x + 1) / 2) * rect.width, y: rect.top + ((1 - ndc.y) / 2) * rect.height };
}

/** Test hook used by the Playwright success-criterion test. */
function Probe({ x, unitsRef }: { x: ExplorerApi; unitsRef: React.RefObject<InstancedMesh | null> }) {
  const { camera, gl } = useThree();
  useEffect(() => {
    window.__condoscope = { projectUnit: (id) => screenPoint(x, id, unitsRef.current, camera, gl.domElement.getBoundingClientRect(), 3) };
    return () => { delete window.__condoscope; };
  }, [x, camera, gl, unitsRef]);
  return null;
}
