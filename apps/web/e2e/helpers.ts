import { mulberry32, type Dataset } from '@condoscope/shared';
import { type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const data: Dataset = JSON.parse(readFileSync(fileURLToPath(new URL('../src/data/fallback.json', import.meta.url)), 'utf8'));
export const panelTitle = (page: Page) => page.locator('section[aria-label="รายละเอียดห้อง"] h2');

/**
 * Waits until the page answers quickly again: no animation frame took longer than `maxGapMs` (1.5 s: a frame here takes 0.2-0.5 s even on a fast machine) for `quietMs`.
 * The scene renders continuously on software WebGL; on a small CI runner the first seconds (shadow maps, then the switch
 * to the cheaper quality tier) can keep the main thread busy for 20 s, and a click made meanwhile is only handled
 * after that (seen in CI traces: /api/units/… was requested 22 s after the click). Clicking before this state is a race.
 */
export async function untilResponsive(page: Page, { maxGapMs = 1500, quietMs = 2000, timeout = 120_000 } = {}) {
  await page.waitForFunction(({ maxGapMs, quietMs }) => {
    const w = window as unknown as { __gap?: { last: number; slow: number } };
    if (!w.__gap) {
      const g = (w.__gap = { last: performance.now(), slow: performance.now() });
      const tick = (t: number) => { if (t - g.last > maxGapMs) g.slow = t; g.last = t; requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }
    const now = performance.now();
    return now - w.__gap.slow > quietMs && now - w.__gap.last < maxGapMs;
  }, { maxGapMs, quietMs }, { timeout, polling: 100 });
}

export async function open3D(page: Page, projectId: number) {
  await page.goto(`#/explorer/${projectId}`);
  await page.waitForFunction(() => !!window.__condoscope, null, { timeout: 60_000 });
  await untilResponsive(page); // first frames + shadow maps + quality tier settle
}

/** Up to n units of the project that are visible from the current camera, in a fixed pseudo-random order. */
export async function visibleUnits(page: Page, projectId: number, n: number) {
  const buildingIds = new Set(data.buildings.filter((b) => b.project_id === projectId).map((b) => b.id));
  const units = data.units.filter((u) => buildingIds.has(u.building_id));
  const rng = mulberry32(projectId);
  const order = units.map((u) => ({ u, k: rng() })).sort((a, b) => a.k - b.k).map((x) => x.u);
  const found: { id: number; unit_number: string; x: number; y: number }[] = [];
  for (const u of order) {
    const p = await page.evaluate((id) => window.__condoscope!.projectUnit(id), u.id);
    if (p) found.push({ id: u.id, unit_number: u.unit_number, ...p });
    if (found.length === n) break;
  }
  return found;
}
