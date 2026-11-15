import type { ExplorerPayload } from '@condoscope/shared';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { ACESFilmicToneMapping, InstancedMesh } from 'three';
import City from '../explorer/scene/City';
import Landscape from '../explorer/scene/Landscape';
import { projectBounds, unitWorldCenter, type Bounds } from '../explorer/scene/layout';
import Site from '../explorer/scene/Site';
import Sky from '../explorer/scene/Sky';
import { LOOK, uNight } from '../explorer/scene/time';
import Towers, { type TowerSource } from '../explorer/scene/Towers';
import { diveGoal, orbitPose } from './poses';
import { FRAME_SAMPLES, storyTooSlow } from './slowStory';
import type { Story } from './story';
import { CHAPTER_START } from './timeline';

const noop = () => {};

/** Where the chosen unit is on the canvas, in percent of its width and height (the picture of the room opens from there). */
export interface Anchor { x: number; y: number }

/**
 * The 3D tier of the story: the explorer's scene without shadows, SSAO or controls, drawn only when the scroll moves (frameloop="demand").
 * The camera is a pure function of `p`, so a page opened mid-story is right from the first frame. `onFailure` asks the parent for the stills.
 */
export default function StoryScene({ data, story, p, anchor, lit, onFailure }: {
  data: ExplorerPayload; story: Story; p: MutableRefObject<number>; anchor: MutableRefObject<Anchor | null>; lit: number | undefined; onFailure(): void;
}) {
  const bounds = useMemo(() => projectBounds(data.buildings), [data.buildings]);
  const mobile = useMemo(() => matchMedia('(pointer: coarse)').matches, []);
  const source = useMemo<TowerSource>(() => ({
    units: data.units, buildings: data.buildings, cutFloor: null, isVisible: () => true,
    selectedId: null, hoveredId: null, statusMode: false, filters: { maxPrice: null, bedrooms: null }, matches: () => true, mine: new Set<number>(),
  }), [data]);
  const start = useMemo(() => poseAt(bounds, story, p.current), [bounds, story, p]);
  const unitsRef = useRef<InstancedMesh>(null);
  const look = LOOK.dusk;
  uNight.value = 1;

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, mobile ? 1 : 1.25]}
      camera={{ fov: 38, near: 1, far: 5000, position: start.position }}
      gl={{ antialias: !mobile, toneMapping: ACESFilmicToneMapping, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onFailure(); })}
      style={{ pointerEvents: 'none', touchAction: 'pan-y' }}
      aria-hidden
    >
      <Rig bounds={bounds} story={story} p={p} anchor={anchor} onFailure={onFailure} />
      <fog attach="fog" args={[look.fog, 350, 1500]} />
      <Sky time="dusk" />
      <hemisphereLight args={look.hemi} />
      <directionalLight position={look.sun.position} intensity={look.sun.intensity} color={look.sun.color} />
      <Site r={bounds} seed={data.project.id * 7919} />
      <Landscape r={bounds} seed={data.project.id * 7919} time="dusk" />
      <City r={bounds} seed={data.project.id * 7919} time="dusk" focus={null} reducedMotion />
      <Towers x={source} storyFloor={lit} unitsRef={unitsRef} onHover={noop} onPick={noop} />
    </Canvas>
  );
}

/** Orbit before the dive, swing-in during it. */
function poseAt(bounds: Bounds, story: Story, p: number) {
  return p < CHAPTER_START.dive ? orbitPose(bounds, p) : diveGoal(story.building, story.unit, p, orbitPose(bounds, 1));
}

/** Moves the camera to the pose for the current `p`; draws a frame only when `p` changed, and gives up (onFailure) if frames are too slow. */
function Rig({ bounds, story, p, anchor, onFailure }: { bounds: Bounds; story: Story; p: MutableRefObject<number>; anchor: MutableRefObject<Anchor | null>; onFailure(): void }) {
  const { camera, invalidate } = useThree();
  const drawn = useRef(NaN);
  const samples = useRef<number[]>([]);
  const lastFrame = useRef(0);

  useEffect(() => {
    let raf = 0;
    const watch = () => { if (p.current !== drawn.current) invalidate(); raf = requestAnimationFrame(watch); };
    raf = requestAnimationFrame(watch);
    return () => cancelAnimationFrame(raf);
  }, [p, invalidate]);

  useFrame(() => {
    const now = performance.now();
    const dt = now - lastFrame.current;
    lastFrame.current = now;
    if (dt < 120 && samples.current.length < FRAME_SAMPLES) { // only frames drawn back to back (the visitor is scrolling) say how fast the scene is
      samples.current.push(dt);
      if (storyTooSlow(samples.current)) onFailure();
    }
    drawn.current = p.current;
    const pose = poseAt(bounds, story, p.current);
    camera.position.set(...pose.position);
    camera.lookAt(...pose.target);
    camera.updateMatrixWorld();
    const c = unitWorldCenter(story.building, story.unit).project(camera);
    anchor.current = { x: (c.x + 1) * 50, y: (1 - c.y) * 50 };
  });
  return null;
}
