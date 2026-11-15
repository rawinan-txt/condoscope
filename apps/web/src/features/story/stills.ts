/** Where (progress) each of the four pre-rendered stills is at full strength: the first screen, the orbit, a second tower, the room. */
export const STILL_AT = [0.03, 0.3, 0.55, 0.82] as const;

/** Opacity of each still: a cross-fade between neighbours, the first/last held before/after, so the weights always add up to 1. */
export function stillOpacities(p: number): number[] {
  const out = [0, 0, 0, 0];
  if (p <= STILL_AT[0]) { out[0] = 1; return out; }
  if (p >= STILL_AT[3]) { out[3] = 1; return out; }
  const i = STILL_AT.findIndex((c, k) => p >= c && p < STILL_AT[k + 1]);
  const t = (p - STILL_AT[i]) / (STILL_AT[i + 1] - STILL_AT[i]);
  out[i] = 1 - t; out[i + 1] = t;
  return out;
}
