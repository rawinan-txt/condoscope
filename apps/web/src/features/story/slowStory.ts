export const FRAME_SAMPLES = 30;
const TOO_SLOW_MS = 28;

/** True when the first 30 frames drawn while the visitor was scrolling averaged more than 28 ms (the same idea as `onSlow` in the explorer). */
export const storyTooSlow = (frameMs: number[]): boolean =>
  frameMs.length >= FRAME_SAMPLES && frameMs.slice(0, FRAME_SAMPLES).reduce((a, b) => a + b, 0) / FRAME_SAMPLES > TOO_SLOW_MS;
