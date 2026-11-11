import { useMediaQuery } from './useMediaQuery';

/** True when the person asked the system for less motion (`prefers-reduced-motion: reduce`); follows changes while the page is open. */
export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)', false);
