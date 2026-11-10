const KB = 1024;

/** gzip budgets. entry = everything loaded when the home page opens; map = measured 293.6 KB + 10% (plan 3, task 8). */
export const BUDGETS = { entryGzip: 130 * KB, buildingGzip: 600 * KB, mapGzip: 323 * KB };

/** Chunks that must exist on their own and must not be loaded at start (name prefix → budget key or null). */
const LAZY = { Building3D: 'buildingGzip', MapView: 'mapGzip', fallback: null };
const FORBIDDEN_AT_START = ['WebGLRenderer', 'maplibre'];

/**
 * @param {{ name: string; code: string; gzipBytes: number; initial: boolean }[]} chunks  initial = loaded when the home page opens
 * @returns {string[]} problems; empty = fine
 */
export function evaluateBundles(chunks) {
  const problems = [];
  const initial = chunks.filter((c) => c.initial);

  for (const c of initial) {
    for (const word of FORBIDDEN_AT_START) {
      if (c.code.includes(word)) problems.push(`initial chunk ${c.name} contains "${word}": it must stay out of the home page`);
    }
  }
  const total = initial.reduce((s, c) => s + c.gzipBytes, 0);
  if (total > BUDGETS.entryGzip) problems.push(`initial chunks are ${(total / KB).toFixed(1)} KB gzip, budget ${BUDGETS.entryGzip / KB} KB`);

  for (const [prefix, budget] of Object.entries(LAZY)) {
    const found = chunks.filter((c) => c.name.startsWith(`${prefix}-`));
    if (found.length === 0) problems.push(`no ${prefix} chunk: it was merged into another chunk`);
    for (const c of found) {
      if (c.initial) problems.push(`${c.name} is loaded at start, it must be lazy`);
      if (budget && c.gzipBytes > BUDGETS[budget]) problems.push(`${c.name} is ${(c.gzipBytes / KB).toFixed(1)} KB gzip, budget ${BUDGETS[budget] / KB} KB`);
    }
  }
  return problems;
}
