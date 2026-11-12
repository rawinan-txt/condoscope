/**
 * Frames drawn in each of the last whole seconds (oldest first, only counted after the first frame was drawn).
 * True when the scene is so slow that waiting for PerformanceMonitor would take too long: three seconds in a row with 3 frames or fewer.
 * drei's PerformanceMonitor needs 8 slow samples, and a sample lasts at least one frame, so with frames of 3 s it reacts after ~24 s
 * (seen on a CI runner with software WebGL: the page, including every click, was blocked that long).
 */
export function tooSlow(framesPerSecond: number[]): boolean {
  const last = framesPerSecond.slice(-3);
  return last.length === 3 && last.every((n) => n <= 3);
}
