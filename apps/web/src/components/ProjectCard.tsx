import { formatMillion, type Project } from '@condoscope/shared';
import { useState, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { Link, useNavigate } from 'react-router';
import { useReducedMotion } from '../hooks/useReducedMotion';
import AiBadge from './AiBadge';
import { heroSrc } from './HeroImage';

/** One link per card (a stretched pseudo-element makes the whole card clickable without nesting anchors). */
export default function ProjectCard({ project: p }: { project: Project }) {
  const to = `/project/${p.id}`;
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  // only the card being opened gets the name: two elements with the same view-transition-name make the transition fail
  const [opening, setOpening] = useState(false);

  /**
   * Router 8 only runs view transitions in data routers, and this app uses HashRouter, so the page change is wrapped here:
   * name this card's picture, then change the page inside document.startViewTransition (the project page names its hero the same).
   * No support or reduced motion: the link behaves as a plain link.
   */
  function open(e: MouseEvent) {
    if (reduced || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (typeof document.startViewTransition !== 'function') return;
    e.preventDefault();
    flushSync(() => setOpening(true));
    document.startViewTransition(() => { flushSync(() => navigate(to, { state: { project: p } })); }).finished.catch(() => {}).finally(() => setOpening(false));
  }
  const [thumb, setThumb] = useState(false); // the small AI hero is missing: use the old 3D thumbnail
  const src = p.thumbnail_url && (thumb ? p.thumbnail_url : heroSrc(p.thumbnail_url).srcSm);
  return (
    <article className="group relative flex flex-col">
      <div className="relative overflow-hidden bg-ink/5" style={opening ? { viewTransitionName: 'project-hero' } : undefined}>
        {src ? (
          <>
            <img src={`${import.meta.env.BASE_URL}${src}`} alt={`ภาพโครงการ ${p.name}`} loading="lazy" onError={() => setThumb(true)} className="aspect-[4/3] w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.03]" />
            {!thumb && <AiBadge />}
          </>
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center text-sm text-stone">ยังไม่มีภาพโครงการ</div>
        )}
      </div>
      {p.is_featured && <span className="absolute left-2 top-2 bg-champagne px-2 py-0.5 text-xs font-medium text-ink">แนะนำ</span>}
      <div className="flex flex-1 flex-col gap-1 pt-4">
        <h3 className="font-serif text-2xl">{p.name}</h3>
        <p className="text-sm text-stone">{p.neighborhood} · {p.province}</p>
        <p className="mt-1 font-semibold text-bronze">เริ่มต้น {formatMillion(p.starting_price)}</p>
        <p className="text-sm text-stone">{p.total_floors} ชั้น · {p.total_units} ห้อง</p>
        <Link to={to} state={{ project: p }} onClick={open} className="mt-3 inline-block self-start text-sm font-medium underline decoration-champagne decoration-2 underline-offset-4 after:absolute after:inset-0 group-hover:text-bronze">
          ดูรายละเอียด
        </Link>
      </div>
    </article>
  );
}
