import { useSyncExternalStore } from 'react';

/** Live `matchMedia`. Without matchMedia (tests/jsdom) it answers `fallback` (desktop by default). */
export function useMediaQuery(query: string, fallback = true): boolean {
  return useSyncExternalStore(
    (notify) => {
      const m = window.matchMedia?.(query);
      m?.addEventListener('change', notify);
      return () => m?.removeEventListener('change', notify);
    },
    () => window.matchMedia?.(query).matches ?? fallback,
    () => fallback,
  );
}
