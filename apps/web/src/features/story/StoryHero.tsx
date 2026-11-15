import { imageFile, type Project } from '@condoscope/shared';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import AiBadge from '../../components/AiBadge';
import { scrimBackground } from '../../components/theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { hasWebGL } from '../../lib/hasWebGL';
import Hero, { SearchBox } from '../home/Hero';
import ThreeBoundary from '../explorer/ThreeBoundary';
import Counter from './Counter';
import type { Anchor } from './StoryScene';
import StoryStills from './StoryStills';
import { chapterAt, countAt, interiorReveal, litFloors, sceneAt, searchOpacity, CHAPTER_START, type Chapter } from './timeline';
import { chooseTier, type TierEnv } from './tier';
import { useScrollProgress } from './useScrollProgress';
import { useStoryData, type StoryData } from './useStoryData';

const StoryScene = lazy(() => import('./StoryScene'));

function readEnv(reducedMotion: boolean): TierEnv {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string }; deviceMemory?: number };
  return {
    reducedMotion, saveData: !!nav.connection?.saveData, effectiveType: nav.connection?.effectiveType, hasWebGL: hasWebGL(),
    cores: nav.hardwareConcurrency, memoryGb: nav.deviceMemory, coarsePointer: window.matchMedia?.('(pointer: coarse)').matches ?? false, width: window.innerWidth,
  };
}

/** What each chapter says. The first chapter is the search box itself (its heading is the h1 of the page). */
const COPY: Record<Exclude<Chapter, 'search'>, { title: string; body: (n: number) => string }> = {
  filter: { title: 'ค้นหาและกรองได้ตามใจ', body: (n) => `${n} โครงการ กรองตามทำเล ราคา และจำนวนห้องนอน` },
  map: { title: 'ดูทำเลบนแผนที่', body: () => 'ปักหมุดทุกโครงการในกรุงเทพฯ และปริมณฑล เลือกจากที่ตั้งได้เลย' },
  tower: { title: 'เลือกห้องจากตัวตึก', body: () => 'ดูสถานะห้องทีละชั้น ว่าง จอง หรือขายแล้ว' },
  plan: { title: 'ดูแปลนและภาพภายในห้อง', body: () => 'คลิกจุดบนแปลนเพื่อดูภาพห้องแต่ละมุมก่อนตัดสินใจ' },
  reserve: { title: 'จองห้องแบบเดโม', body: () => 'เก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น ไม่มีการขายจริง' },
};
const STEPS = Object.keys(COPY) as (keyof typeof COPY)[];
const AVAILABLE_LABEL = 'ห้องว่างรวมทุกโครงการ';

let sceneFailed = false; // once the 3D could not keep up or failed, the stills stay for the rest of the visit

/**
 * The first screen of the home page and the story that follows it. The search box floats on a picture of a tower: a still at once,
 * the live 3D when it has loaded (strong devices only). Scrolling tells how the site works; nothing holds the scroll back, and
 * with reduced motion it is a still hero followed by plain content.
 */
export default function StoryHero({ projects }: { projects: Project[] }) {
  const reduced = useReducedMotion();
  const tier = useMemo(() => chooseTier(readEnv(reduced)), [reduced]);
  return tier === 'static' ? <Quiet projects={projects} /> : <Staged projects={projects} tier={tier} />;
}

/** Reduced motion: the still hero, then the same story as a list with the final numbers. No pinned stage, no scrubbing. */
function Quiet({ projects }: { projects: Project[] }) {
  const { totals, picks } = useStoryData(projects, 'static', 0);
  const first = picks[0];
  return (
    <>
      <Hero projects={projects} />
      <section aria-label="วิธีใช้งานเว็บนี้" className="bg-ink text-white">
        <div className="mx-auto max-w-4xl space-y-8 px-4 py-20">
          <ol className="space-y-6">
            {STEPS.map((c) => (
              <li key={c}>
                <h2 className="font-serif text-2xl">{COPY[c].title}</h2>
                <p className="mt-1 text-lg">{COPY[c].body(totals?.projects ?? projects.length)}</p>
              </li>
            ))}
          </ol>
          {totals?.available != null && <Counter value={totals.available} total={totals.available} label={AVAILABLE_LABEL} />}
          <Ends first={first} />
        </div>
      </section>
      <div id="story-end" tabIndex={-1} className="outline-none" />
    </>
  );
}

function Ends({ first, unitId }: { first?: Project; unitId?: number }) {
  return (
    <div className="flex flex-wrap gap-4">
      <Link to="/search" className="inline-block bg-champagne px-8 py-3 font-medium text-ink hover:bg-champagne-soft">เริ่มค้นหาคอนโด</Link>
      {first && <Link to={`/explorer/${first.id}${unitId ? `?unit=${unitId}` : ''}`} className="inline-block border border-white px-8 py-3 text-white hover:bg-white/10">ลองดูตึก 3 มิติ</Link>}
    </div>
  );
}

function Staged({ projects, tier }: { projects: Project[]; tier: 'stills' | 'live' }) {
  const track = useRef<HTMLDivElement>(null);
  const pRef = useRef(0);
  const anchor = useRef<Anchor | null>(null);
  const [step, setStep] = useState(0); // progress in hundredths: at most 101 renders for the whole scroll
  useScrollProgress(track, (v) => { pRef.current = v; setStep(Math.round(v * 100)); });
  const p = step / 100;
  const data = useStoryData(projects, tier, step);
  const [failed, setFailed] = useState(sceneFailed);
  const live = tier === 'live' && !failed;
  const fail = () => { sceneFailed = true; setFailed(true); };
  const chapter = chapterAt(p);
  const fade = searchOpacity(p);

  const wanted = sceneAt(p);
  const shown = useShownScene(data, wanted);
  const [ready, setReady] = useState(false);
  const room = data.scenes[2]?.story.unit;
  const total = data.totals?.available ?? null;

  return (
    <>
      <div ref={track} className="story-track">
        <div className="story-stage sticky top-0 h-[calc(100svh-3.5rem)] overflow-hidden bg-ink">
          <StoryStills p={p} fallback="images/home-hero.webp" />
          {live && shown.scene && (
            <div className="absolute inset-0 transition-opacity duration-500" style={{ opacity: ready && !shown.dim ? 1 : 0 }}>
              <ThreeBoundary onError={fail} fallback={null}>
                <Suspense fallback={null}>
                  <StoryScene scene={shown.scene} index={wanted} p={pRef} anchor={anchor} onReady={() => setReady(true)} onFailure={fail}
                    lit={p >= CHAPTER_START.tower && shown.index >= 1 ? litFloors(p, shown.scene.story.building.first_res_floor, shown.scene.story.building.last_res_floor) : undefined} />
                </Suspense>
              </ThreeBoundary>
            </div>
          )}
          <Interior unit={room} reveal={interiorReveal(p)} anchor={live && shown.index === 2 ? anchor.current : null} />
          <div className="absolute inset-0" style={{ background: scrimBackground }} aria-hidden />

          <div className="absolute inset-0 flex flex-col justify-end">
            <div inert={fade === 0} style={{ opacity: fade }} className={fade === 0 ? 'pointer-events-none' : undefined}><SearchBox projects={projects} /></div>
          </div>
          <button type="button" onClick={() => { const end = document.getElementById('story-end'); end?.scrollIntoView?.(); end?.focus({ preventScroll: true }); }}
            className="absolute left-4 top-4 z-20 -translate-y-24 bg-ivory px-4 py-2 text-ink focus:translate-y-0">ข้ามส่วนนี้</button>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-16">
            <div className="grid">
              {STEPS.map((c) => (
                <div key={c} data-active={c === chapter} className={`col-start-1 row-start-1 max-w-xl transition-opacity duration-500 ${c === chapter ? 'opacity-100' : 'opacity-0'}`}>
                  <h2 className="font-serif text-3xl md:text-5xl">{COPY[c].title}</h2>
                  <p className="mt-3 text-lg">{COPY[c].body(data.totals?.projects ?? projects.length)}</p>
                </div>
              ))}
            </div>
            {total !== null && (
              <div className={`mt-6 transition-opacity duration-500 ${chapter === 'tower' ? 'opacity-100' : 'opacity-0'}`}>
                <Counter value={countAt(p, total)} total={total} label={AVAILABLE_LABEL} />
              </div>
            )}
            <div className={`mt-6 transition-opacity duration-500 ${chapter === 'reserve' ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0 focus-within:opacity-100'}`}>
              <Ends first={data.picks[2] ?? data.picks[0]} unitId={room?.id} />
            </div>
          </div>
        </div>
      </div>
      <div id="story-end" tabIndex={-1} className="outline-none" />
    </>
  );
}

/**
 * Which tower to show: the one the story wants, or the latest loaded one before it (a tower that has not arrived yet must not leave a hole).
 * When it changes the canvas dips for a moment so the swap is not a hard cut.
 */
function useShownScene(data: StoryData, wanted: 0 | 1 | 2) {
  let index = -1;
  for (let i = 0; i <= wanted; i++) if (data.scenes[i]) index = i;
  const [current, setCurrent] = useState(index);
  const [dim, setDim] = useState(false);
  useEffect(() => {
    if (index === current) return;
    if (current < 0) { setCurrent(index); return; }
    setDim(true);
    const t = setTimeout(() => { setCurrent(index); setDim(false); }, 250);
    return () => clearTimeout(t);
  }, [index, current]);
  return { index: current, scene: current >= 0 ? data.scenes[current] ?? null : null, dim };
}

/** The living room of the shown unit (an AI picture): it opens from the unit window while the camera arrives; without a window position it fades in. */
function Interior({ unit, reveal, anchor }: { unit?: { unit_type: Parameters<typeof imageFile>[0] }; reveal: number; anchor: Anchor | null }) {
  const style = anchor
    ? { opacity: Math.min(1, reveal * 3), transform: `scale(${0.04 + 0.96 * reveal})`, transformOrigin: `${anchor.x}% ${anchor.y}%` }
    : { opacity: reveal };
  return (
    <div data-testid="story-interior" className="absolute inset-0 overflow-hidden" style={style}>
      <img src={`${import.meta.env.BASE_URL}images/interiors/${imageFile(unit?.unit_type ?? '1br', 'living')}.webp`} alt="ห้องนั่งเล่นของห้องตัวอย่าง" loading="lazy" className="h-full w-full object-cover" />
      <AiBadge />
    </div>
  );
}
