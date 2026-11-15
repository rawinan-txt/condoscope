import { useCallback, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router';

/** localStorage key that says the first-visit intro has been seen. */
export const INTRO_KEY = 'condoscope.intro';

let seenInMemory = false; // when storage is blocked the intro still must not come back within the visit
const listeners = new Set<() => void>();

function stored(): boolean {
  try { return localStorage.getItem(INTRO_KEY) === 'seen'; } catch { return false; }
}

export const hasSeenIntro = (): boolean => seenInMemory || stored();

/** The visitor finished or skipped the intro: remember it (storage if it works, memory always) and tell the pages. */
export function completeIntro(): void {
  seenInMemory = true;
  try { localStorage.setItem(INTRO_KEY, 'seen'); } catch { /* blocked storage: the memory flag is enough for this visit */ }
  listeners.forEach((l) => l());
}

/** For tests: forget everything. */
export function resetIntro(): void {
  seenInMemory = false;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export const useSeenIntro = (): boolean => useSyncExternalStore(subscribe, hasSeenIntro, () => false);

/** True while the intro is what the page shows: the first visit to the home page, or the replay at /intro. Other pages never show it. */
export const useIntroActive = (pathname: string): boolean => {
  const seen = useSeenIntro();
  return pathname === '/intro' || (pathname === '/' && !seen);
};

/** What the skip button and the last chapter do: remember the intro as seen and show the normal home page. */
export function useFinishIntro(): () => void {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return useCallback(() => {
    completeIntro();
    if (pathname === '/intro') navigate('/', { replace: true }); // the replay lives at its own address; the first visit is already at "/"
    window.scrollTo(0, 0);
  }, [navigate, pathname]);
}
