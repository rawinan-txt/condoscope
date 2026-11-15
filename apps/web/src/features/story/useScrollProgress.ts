import { useEffect, useRef, type RefObject } from 'react';
import { sectionProgress } from './scroll';

/**
 * Calls `onChange(p)` with the scroll progress of the element (see sectionProgress): once on mount (a page opened or restored mid-story),
 * then at most once per animation frame and only when the value changed. The scroll listener is passive: this never holds the scroll back.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>, onChange: (p: number) => void): void {
  const cb = useRef(onChange);
  cb.current = onChange;
  useEffect(() => {
    let last = NaN;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      // clientHeight (not innerHeight) follows the same box as `svh`, so the iOS address bar does not make p jump
      const p = sectionProgress(el.getBoundingClientRect(), document.documentElement.clientHeight);
      if (p !== last) { last = p; cb.current(p); }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    schedule();
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref]);
}
