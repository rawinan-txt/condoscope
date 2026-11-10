import { describe, expect, it } from 'vitest';
import { BUDGETS, evaluateBundles } from './bundle-rules.mjs';

const KB = 1024;
const chunk = (name, over = {}) => ({ name, code: 'ok', gzipBytes: 50 * KB, initial: false, ...over });
const GOOD = [
  chunk('index-a.js', { initial: true, gzipBytes: 98 * KB }),
  chunk('rolldown-runtime-a.js', { initial: true, gzipBytes: 1 * KB }),
  chunk('Building3D-a.js', { gzipBytes: 302 * KB }),
  chunk('MapView-a.js', { gzipBytes: 294 * KB }),
  chunk('fallback-a.js', { gzipBytes: 28 * KB }),
];

describe('evaluateBundles', () => {
  it('passes the normal split', () => {
    expect(evaluateBundles(GOOD)).toEqual([]);
  });

  it('the home page must not load three.js', () => {
    const bad = [...GOOD.slice(1), chunk('index-a.js', { initial: true, code: 'new WebGLRenderer()' })];
    expect(evaluateBundles(bad).join('\n')).toMatch(/index-a\.js.*WebGLRenderer/);
  });

  it('the home page must not load maplibre', () => {
    const bad = [...GOOD.slice(1), chunk('index-a.js', { initial: true, code: 'import "maplibre-gl"' })];
    expect(evaluateBundles(bad).join('\n')).toMatch(/index-a\.js.*maplibre/);
  });

  it('the initial chunks together stay within the entry budget', () => {
    const bad = [chunk('index-a.js', { initial: true, gzipBytes: BUDGETS.entryGzip }), chunk('x-a.js', { initial: true, gzipBytes: 1 * KB }), ...GOOD.slice(2)];
    expect(evaluateBundles(bad).join('\n')).toMatch(/initial/i);
  });

  it('the 3D and map chunks have their own budgets', () => {
    const over3d = GOOD.map((c) => (c.name.startsWith('Building3D') ? { ...c, gzipBytes: BUDGETS.buildingGzip + 1 } : c));
    expect(evaluateBundles(over3d).join('\n')).toMatch(/Building3D/);
    const overMap = GOOD.map((c) => (c.name.startsWith('MapView') ? { ...c, gzipBytes: BUDGETS.mapGzip + 1 } : c));
    expect(evaluateBundles(overMap).join('\n')).toMatch(/MapView/);
  });

  it('the 3D, map and fallback-data chunks must exist and must not be loaded at start', () => {
    for (const prefix of ['Building3D', 'MapView', 'fallback']) {
      const missing = GOOD.filter((c) => !c.name.startsWith(prefix));
      expect(evaluateBundles(missing).join('\n'), `${prefix} missing`).toMatch(new RegExp(prefix));
      const eager = GOOD.map((c) => (c.name.startsWith(prefix) ? { ...c, initial: true } : c));
      expect(evaluateBundles(eager).join('\n'), `${prefix} eager`).toMatch(new RegExp(prefix));
    }
  });
});
