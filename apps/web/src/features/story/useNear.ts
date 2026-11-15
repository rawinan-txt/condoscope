import { useEffect, useState, type RefObject } from 'react';

/** True once the element is within 60% of a screen of the viewport and the browser is idle. Without IntersectionObserver (old browsers, tests) it is true at once. Never goes back to false. */
export function useNear(ref: RefObject<Element | null>): boolean {
  const [near, setNear] = useState(typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const el = ref.current;
    if (near || !el) return;
    const idle = (cb: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(cb, { timeout: 1500 }) : setTimeout(cb, 200));
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); idle(() => setNear(true)); }
    }, { rootMargin: '60% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [near, ref]);
  return near;
}
