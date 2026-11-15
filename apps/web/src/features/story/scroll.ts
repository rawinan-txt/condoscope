export const clamp01 = (x: number): number => (x >= 1 ? 1 : x > 0 ? x : 0); // NaN falls through to 0

/** 0 before `from`, 1 after `to`, a straight line between. An empty range is a step (no division by zero). */
export const remap = (p: number, from: number, to: number): number => (to <= from ? (p >= to ? 1 : 0) : clamp01((p - from) / (to - from)));

export const easeInOut = (t: number): number => { const x = clamp01(t); return x * x * (3 - 2 * x); };

/** How far through a tall section the viewport has scrolled: 0 when its top is at the top of the screen, 1 when its bottom reaches the screen bottom. */
export const sectionProgress = (rect: { top: number; height: number }, viewportH: number): number =>
  rect.height <= viewportH ? 0 : clamp01(-rect.top / (rect.height - viewportH));
