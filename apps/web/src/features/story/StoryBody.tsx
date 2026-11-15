import type { Project } from '@condoscope/shared';
import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import HeroImage, { projectHero } from '../../components/HeroImage';
import { scrimBackground } from '../../components/theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useResource } from '../../hooks/useResource';
import { hasWebGL } from '../../lib/hasWebGL';
import { getExplorer } from '../../services/api';
import Counter from './Counter';
import { storyOf, type Story as StoryData } from './story';
import StoryStills from './StoryStills';
import { chapterAt, countAt, type Chapter } from './timeline';
import { chooseTier, type TierEnv } from './tier';
import { useScrollProgress } from './useScrollProgress';

function readEnv(reducedMotion: boolean): TierEnv {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string }; deviceMemory?: number };
  return {
    reducedMotion, saveData: !!nav.connection?.saveData, effectiveType: nav.connection?.effectiveType, hasWebGL: hasWebGL(),
    cores: nav.hardwareConcurrency, memoryGb: nav.deviceMemory, coarsePointer: window.matchMedia?.('(pointer: coarse)').matches ?? false, width: window.innerWidth,
  };
}

const TEXT: Record<Chapter, (name: string, available: number) => string> = {
  hero: () => 'เห็นตึกก่อน แล้วค่อยเลือกห้อง',
  orbit: (name) => `หมุนรอบ ${name} ดูทำเลและทิศของตึก`,
  lights: () => 'ห้องว่างสว่างขึ้นทีละชั้น',
  count: (_n, available) => `ตอนนี้มี ${available} ห้องว่าง`,
  dive: () => 'เลือกห้องที่ใช่ แล้วเข้าไปดูข้างใน',
  cta: () => 'พร้อมแล้ว ไปเลือกห้องจากตัวตึกได้เลย',
};
const ORDER = Object.keys(TEXT) as Chapter[];

export default function StoryBody({ project }: { project: Project }) {
  const r = useResource(() => getExplorer(project.id), [project.id]);
  if (r.state === 'loading') return <div className="h-svh" aria-hidden />;
  const story = r.state === 'ok' ? storyOf(r.data) : null;
  return story ? <Told project={project} story={story} /> : null;
}

function Told({ project, story }: { project: Project; story: StoryData }) {
  const reduced = useReducedMotion();
  const tier = useMemo(() => chooseTier(readEnv(reduced)), [reduced]);
  const track = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0); // progress in hundredths: at most 101 renders for the whole scroll
  useScrollProgress(track, (v) => setStep(Math.round(v * 100)));
  const p = tier === 'static' ? 1 : step / 100;
  const chapter = chapterAt(p);
  const count = countAt(p, story.available);
  const href = `/explorer/${project.id}?unit=${story.unit.id}`;
  const skip = (
    <button type="button" onClick={() => { const end = document.getElementById('story-end'); end?.scrollIntoView?.(); end?.focus({ preventScroll: true }); }}
      className="absolute left-4 top-4 z-20 -translate-y-24 bg-ivory px-4 py-2 text-ink focus:translate-y-0">ข้ามส่วนนี้</button>
  );
  const cta = (visible: boolean) => (
    <Link to={href} className={`inline-block bg-champagne px-8 py-3 font-medium text-ink transition-opacity hover:bg-champagne-soft focus:opacity-100 ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>เข้าสำรวจตึกนี้</Link>
  );

  if (tier === 'static') {
    const hero = projectHero(project);
    return (
      <div className="relative mx-auto max-w-4xl space-y-8 px-4 py-20">
        {skip}
        {hero && <div className="relative aspect-[16/9] overflow-hidden"><HeroImage {...hero} /></div>}
        <ul className="space-y-3 text-lg">{ORDER.filter((c) => c !== 'count' && c !== 'cta').map((c) => <li key={c}>{TEXT[c](project.name, story.available)}</li>)}</ul>
        <Counter value={story.available} total={story.available} />
        <p className="text-lg">{TEXT.count(project.name, story.available)}</p>
        {cta(true)}
      </div>
    );
  }

  return (
    <div ref={track} className="story-track">
      <div className="story-stage sticky top-0 h-svh overflow-hidden">
        {skip}
        <StoryStills p={p} project={project} />
        <div className="absolute inset-0" style={{ background: scrimBackground }} aria-hidden />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-16">
          <div className="grid">
            {ORDER.map((c) => (
              <p key={c} data-active={c === chapter} className={`col-start-1 row-start-1 max-w-xl font-serif text-3xl transition-opacity duration-500 md:text-5xl ${c === chapter ? 'opacity-100' : 'opacity-0'}`}>{TEXT[c](project.name, story.available)}</p>
            ))}
          </div>
          <div className={`mt-6 transition-opacity duration-500 ${chapter === 'count' || chapter === 'dive' || chapter === 'cta' ? 'opacity-100' : 'opacity-0'}`}>
            <Counter value={count} total={story.available} />
          </div>
          <div className="mt-6">{cta(chapter === 'cta')}</div>
        </div>
      </div>
    </div>
  );
}
