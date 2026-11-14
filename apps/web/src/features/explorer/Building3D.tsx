import { buildingWidth, type UnitView } from '@condoscope/shared';
import { Environment, OrbitControls, PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, SSAO } from '@react-three/postprocessing';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ACESFilmicToneMapping, InstancedMesh, Raycaster, Vector2, Vector3, type Camera } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import City, { type FloorFocus } from './scene/City';
import { floorViewGoal, freeWidthFraction, homeView, isCovered, projectBounds, stepCamera, towerBox, unitViewGoal, unitWorldCenter, type Bounds, type Vec3 } from './scene/layout';
import { nextWait, tooSlow } from './scene/frameGuard';
import Landscape from './scene/Landscape';
import Site from './scene/Site';
import Sky from './scene/Sky';
import { LOOK, uNight, type TimeOfDay } from './scene/time';
import Towers from './scene/Towers';
import UnitTooltip from './UnitTooltip';
import type { CutFloor, ExplorerApi } from './useExplorer';

declare global {
  interface Window { __condoscope?: { projectUnit(id: number): { x: number; y: number } | null; cameraBusy(): boolean } }
}

/** Set once the scene proved too slow, so switching 3D -> 2D -> 3D does not start in high quality again (and stall again). */
let deviceIsSlow = savedQuality() === 'low';

/** The visitor's (or the test runner's) saved choice: localStorage 'condoscope.quality' = 'low' starts the scene in the cheaper tier. */
function savedQuality(): string | null {
  try { return localStorage.getItem('condoscope.quality'); } catch { return null; }
}

export default function Building3D({ x, time, onUnavailable }: { x: ExplorerApi; time: TimeOfDay; onUnavailable(): void }) {
  const bounds = useMemo(() => projectBounds(x.buildings), [x.buildings]);
  const home = useMemo(() => homeView(bounds), [bounds]);
  const wrap = useRef<HTMLDivElement>(null);
  // leaving the 3D view (switching to 2D) releases the GL context, which fires webglcontextlost: that is not "WebGL is unavailable"
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const [tipAt, setTipAt] = useState<{ left: number; top: number } | null>(null);
  const coarse = useMemo(() => matchMedia('(pointer: coarse)').matches, []);
  const [low, setLow] = useState(coarse || deviceIsSlow); // phones start in low quality; desktops drop to it when FPS stays < 40, and stay there when the 3D view is opened again
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
    <div ref={wrap} className="relative h-full w-full overflow-hidden" style={{ background: LOOK[time].bg }}>
      <Canvas
        frameloop="demand"
        shadows="percentage"
        dpr={[1, low ? 1.25 : 2]}
        camera={{ fov: 38, near: 1, far: 5000, position: home.position }}
        gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); if (alive.current) onUnavailable(); })}
        onPointerMissed={() => x.hover(null)}
        role="img"
        aria-label="ตึก 3 มิติ ลากเพื่อหมุน เลื่อนล้อเพื่อซูม"
      >
        <Scene x={x} bounds={bounds} home={home} onHover={onHover} time={time} low={low} onSlow={() => { deviceIsSlow = true; setLow(true); }} />
      </Canvas>
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
  const busy = useRef(false); // the camera is still gliding to a goal (test hook)
  const reduced = useReducedMotion();
  const { size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  // the view for "see the whole floor": used by the camera and to find the blocks that hide the floor
  const { cutFloor, buildings } = x;
  const floorGoal = useMemo<FloorFocus | null>(() => {
    if (!cutFloor) return null;
    const b = buildings.find((v) => v.id === cutFloor.building_id)!;
    // fit the floor into the part of the screen the floating panels leave free
    const panels = [...document.querySelectorAll('.glass')].map((el) => el.getBoundingClientRect());
    const neighbours = buildings.filter((o) => o.id !== b.id).map(towerBox); // other towers of the project must not hide the floor
    const g = floorViewGoal(b, cutFloor.floor, aspect, freeWidthFraction(size.width, panels), neighbours);
    return { camera: new Vector3(...g.position), target: new Vector3(...g.target), clearance: Math.hypot(buildingWidth(b), b.footprint_depth_m) / 2 };
  }, [cutFloor, buildings, aspect, size.width]);
  const seed = x.buildings[0].project_id * 7919;
  const look = LOOK[time];
  return (
    <>
      <PerformanceMonitor ms={250} iterations={8} bounds={() => [40, 1000]} onDecline={onSlow} />
      <SlowGuard onSlow={onSlow} />
      <Pacer />
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
      <City r={bounds} seed={seed} time={time} focus={floorGoal} reducedMotion={reduced} />
      <Towers x={x} unitsRef={unitsRef} onHover={onHover} onPick={(u) => x.select(u.id)} />
      <CameraRig x={x} home={home} bounds={bounds} unitsRef={unitsRef} floorGoal={floorGoal} reduced={reduced} busy={busy} />
      <Probe x={x} unitsRef={unitsRef} busy={busy} />
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
function CameraRig({ x, home, bounds, unitsRef, floorGoal, reduced, busy }: {
  x: ExplorerApi; home: { position: Vec3; target: Vec3 }; bounds: Bounds; unitsRef: React.RefObject<InstancedMesh | null>;
  floorGoal: FloorFocus | null; reduced: boolean; busy: React.MutableRefObject<boolean>;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  const goal = useRef<{ pos: Vector3; target: Vector3 } | null>(null);
  const { camera, gl } = useThree();

  const { selectedId } = x;
  useEffect(() => {
    goal.current = floorGoal ? { pos: floorGoal.camera.clone(), target: floorGoal.target.clone() } : { pos: new Vector3(...home.position), target: new Vector3(...home.target) };
    busy.current = true;
  }, [floorGoal, home, busy]);
  // a unit picked from the list or keyboard may be out of sight (e.g. back facade): bring it into view
  useEffect(() => {
    if (selectedId === null || screenPoint(x, selectedId, unitsRef.current, camera, gl.domElement.getBoundingClientRect(), 0)) return;
    const u = x.unit(selectedId)!;
    const v = unitViewGoal(x.buildings.find((b) => b.id === u.building_id)!, u);
    goal.current = { pos: new Vector3(...v.position), target: new Vector3(...v.target) };
    busy.current = true;
  }, [selectedId]); // only a new selection should move the camera, not every re-render

  useFrame((_, dt) => {
    const g = goal.current;
    const c = controls.current;
    busy.current = g !== null;
    if (!g || !c) return;
    const { done } = stepCamera(camera.position, c.target, g, dt, reduced);
    c.update();
    if (done) { goal.current = null; busy.current = false; }
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

/**
 * Screen position of a unit centre, or null when it is off screen, on a cut-away floor, hidden behind
 * another unit or under a floating panel. With px > 0 the unit must also cover px pixels around its centre (so a click cannot land on a neighbour).
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
  const point = { x: rect.left + ((ndc.x + 1) / 2) * rect.width, y: rect.top + ((1 - ndc.y) / 2) * rect.height };
  // a room under a floating panel cannot be seen or clicked, so it does not count as visible (the camera then turns to it)
  const panels = [...document.querySelectorAll('.glass')].map((el) => el.getBoundingClientRect());
  return isCovered(point.x, point.y, panels, 6) ? null : point;
}

/**
 * Keeps drawing (the traffic lights move all the time) but paces itself: see nextWait. The canvas runs with frameloop="demand";
 * interaction (orbit, hover, a React change) still draws at once because three/R3F invalidate on their own.
 */
function Pacer() {
  const invalidate = useThree((s) => s.invalidate);
  const last = useRef(performance.now());
  const waited = useRef(0);
  const period = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  useFrame(() => {
    const now = performance.now();
    const dt = now - last.current;
    last.current = now;
    if (dt >= waited.current) period.current = dt - waited.current; // an early frame (hover, orbit) says nothing about the cost of a frame
    waited.current = nextWait(period.current);
    clearTimeout(timer.current);
    if (waited.current === 0) invalidate();
    else timer.current = setTimeout(invalidate, waited.current);
  });
  return null;
}

/** Drops to the cheaper quality tier within seconds when frames take a second or more (PerformanceMonitor alone needs ~8 slow frames). */
function SlowGuard({ onSlow }: { onSlow(): void }) {
  const frames = useRef(0);
  const cb = useRef(onSlow);
  cb.current = onSlow; // the caller passes a new function every render; the timer below must keep its history across renders
  useFrame(() => { frames.current += 1; });
  useEffect(() => {
    const history: number[] = [];
    let started = false;
    const id = setInterval(() => {
      const n = frames.current;
      frames.current = 0;
      started ||= n > 0; // the first frame also compiles shaders: do not judge before it exists
      if (!started) return;
      history.push(n);
      if (tooSlow(history)) cb.current();
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return null;
}

/** Test hook used by the Playwright success-criterion test. */
function Probe({ x, unitsRef, busy }: { x: ExplorerApi; unitsRef: React.RefObject<InstancedMesh | null>; busy: React.MutableRefObject<boolean> }) {
  const { camera, gl } = useThree();
  useEffect(() => {
    window.__condoscope = { projectUnit: (id) => screenPoint(x, id, unitsRef.current, camera, gl.domElement.getBoundingClientRect(), 3), cameraBusy: () => busy.current };
    return () => { delete window.__condoscope; };
  }, [x, camera, gl, unitsRef, busy]);
  return null;
}
