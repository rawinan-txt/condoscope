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

/**
 * Pause before the next frame, in ms, given how long the last frame took to produce (without our own pause).
 * A scene that needs more than 100 ms per frame is left idle for as long again: the browser's GPU process (software WebGL on a CI runner,
 * a weak integrated GPU) then never builds up a backlog, and the page, clicks and unmounting the canvas stay quick.
 * Fast machines get 0: the next frame is requested at once, as with a continuous loop.
 */
export function nextWait(frameMs: number): number {
  return frameMs > 100 ? Math.min(frameMs, 2000) : 0;
}
