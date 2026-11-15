import { imageFile, type Project } from '@condoscope/shared';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import AiBadge from '../../components/AiBadge';
import { scrimBackground } from '../../components/theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { hasWebGL } from '../../lib/hasWebGL';
import { skipToSearch } from '../../lib/skipToSearch';
import ThreeBoundary from '../explorer/ThreeBoundary';
import Counter from './Counter';
import type { Anchor } from './StoryScene';
import StoryStills from './StoryStills';
import { chapterAt, countAt, interiorReveal, litFloors, sceneAt, CHAPTER_START, type Chapter } from './timeline';
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

/** What each chapter says. */
const COPY: Record<Chapter, { title: string; body: (n: number) => string }> = {
  welcome: { title: 'เลือกคอนโดผ่านตัวตึก 3 มิติ', body: () => 'แนะนำวิธีใช้เว็บนี้ในไม่กี่นาที เลื่อนลงเพื่อดูต่อ' },
  filter: { title: 'ค้นหาและกรองได้ตามใจ', body: (n) => `${n} โครงการ กรองตามทำเล ราคา และจำนวนห้องนอน` },
  map: { title: 'ดูทำเลบนแผนที่', body: () => 'ปักหมุดทุกโครงการในกรุงเทพฯ และปริมณฑล เลือกจากที่ตั้งได้เลย' },
  tower: { title: 'เลือกห้องจากตัวตึก', body: () => 'ดูสถานะห้องทีละชั้น ว่าง จอง หรือขายแล้ว' },
  plan: { title: 'ดูแปลนและภาพภายในห้อง', body: () => 'คลิกจุดบนแปลนเพื่อดูภาพห้องแต่ละมุมก่อนตัดสินใจ' },
  reserve: { title: 'จองห้องแบบเดโม', body: () => 'เก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น ไม่มีการขายจริง' },
};
const ORDER: Chapter[] = ['welcome', 'filter', 'map', 'tower', 'plan', 'reserve'];
const AVAILABLE_LABEL = 'ห้องว่างรวมทุกโครงการ';

let sceneFailed = false; // once the 3D could not keep up or failed, the stills stay for the rest of the visit

/**
 * The top of the home page, every visit: a full-screen tower, then a scroll through how the site works. It ends in "เริ่มหาคอนโด",
 * which scrolls to the search box just below. The skip button lives in the layout (visible while the story is, first in the tab order).
 * Nothing holds the scroll back. With reduced motion it is still slides and loads no 3D code.
 */
export default function Intro({ projects }: { projects: Project[] }) {
  const reduced = useReducedMotion();
  const tier = useMemo(() => chooseTier(readEnv(reduced)), [reduced]);
  return tier === 'static' ? <Slides projects={projects} /> : <Staged projects={projects} tier={tier} />;
}

function Finish({ first, unitId }: { first?: Project; unitId?: number }) {
  return (
    <div className="flex flex-wrap gap-4">
      <button type="button" onClick={skipToSearch} className="inline-block bg-champagne px-8 py-3 font-medium text-ink hover:bg-champagne-soft">เริ่มหาคอนโด</button>
      {first && <Link to={`/explorer/${first.id}${unitId ? `?unit=${unitId}` : ''}`} className="inline-block border border-white px-8 py-3 text-white hover:bg-white/10">ลองดูตึก 3 มิติ</Link>}
    </div>
  );
}

const SLIDE_PICTURE = [1, 2, 2, 3, 4, 0] as const; // which still each slide shows (0 = a room)

/** Reduced motion: still slides one after another, final numbers, no stage, no 3D code. */
function Slides({ projects }: { projects: Project[] }) {
  const { totals, picks } = useStoryData(projects, 'static', 0);
  const base = import.meta.env.BASE_URL;
  return (
    <section data-intro aria-label="แนะนำการใช้งานเว็บ" className="bg-ink text-white">
      <ol>
        {ORDER.map((c, i) => (
          <li key={c} className="relative isolate flex min-h-[80svh] items-end overflow-hidden border-b border-white/10">
            <img src={`${base}${SLIDE_PICTURE[i] ? `images/story/still-${SLIDE_PICTURE[i]}.webp` : `images/interiors/${imageFile('1br', 'living')}.webp`}`} alt="" {...(i === 0 ? { fetchPriority: 'high' as const } : { loading: 'lazy' as const })} className="absolute inset-0 -z-20 h-full w-full object-cover" />
            {!SLIDE_PICTURE[i] && <AiBadge />}
            <div className="absolute inset-0 -z-10" style={{ background: scrimBackground }} aria-hidden />
            <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-14">
              {i === 0 ? <h1 className="font-serif text-4xl md:text-6xl">{COPY[c].title}</h1> : <h2 className="font-serif text-3xl md:text-5xl">{COPY[c].title}</h2>}
              <p className="text-lg">{COPY[c].body(totals?.projects ?? projects.length)}</p>
              {c === 'tower' && totals?.available != null && <Counter value={totals.available} total={totals.available} label={AVAILABLE_LABEL} />}
              {c === 'reserve' && <Finish first={picks[2] ?? picks[0]} />}
            </div>
          </li>
        ))}
      </ol>
    </section>
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

  const wanted = sceneAt(p);
  const shown = useShownScene(data, wanted);
  const [ready, setReady] = useState(false);
  const room = data.scenes[2]?.story.unit;
  const total = data.totals?.available ?? null;

  return (
    <div ref={track} data-intro className="story-track">
      <div className="story-stage sticky top-0 h-svh overflow-hidden bg-ink">
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

        <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-16 text-white">
          <div className="grid">
            {ORDER.map((c) => (
              <div key={c} data-active={c === chapter} className={`col-start-1 row-start-1 max-w-xl transition-opacity duration-500 ${c === chapter ? 'opacity-100' : 'opacity-0'}`}>
                {c === 'welcome' ? <h1 className="font-serif text-4xl md:text-6xl">{COPY[c].title}</h1> : <h2 className="font-serif text-3xl md:text-5xl">{COPY[c].title}</h2>}
                <p className="mt-3 text-lg">{COPY[c].body(data.totals?.projects ?? projects.length)}</p>
              </div>
            ))}
          </div>
          {total !== null && (
            <div className={`mt-6 transition-opacity duration-500 ${chapter === 'tower' ? 'opacity-100' : 'opacity-0'}`}>
              <Counter value={countAt(p, total)} total={total} label={AVAILABLE_LABEL} />
            </div>
          )}
          <div className={`mt-6 transition-opacity duration-500 ${chapter === 'reserve' ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0 focus-within:pointer-events-auto focus-within:opacity-100'}`}>
            <Finish first={data.picks[2] ?? data.picks[0]} unitId={room?.id} />
          </div>
        </div>
      </div>
    </div>
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
