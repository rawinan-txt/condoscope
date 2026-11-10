import { mulberry32, type Dataset } from '@condoscope/shared';
import { type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const data: Dataset = JSON.parse(readFileSync(fileURLToPath(new URL('../src/data/fallback.json', import.meta.url)), 'utf8'));
export const panelTitle = (page: Page) => page.locator('section[aria-label="รายละเอียดห้อง"] h2');

export async function open3D(page: Page, projectId: number) {
  await page.goto(`#/explorer/${projectId}`);
  await page.waitForFunction(() => !!window.__condoscope, null, { timeout: 60_000 });
  await page.waitForTimeout(1500); // first frames + shadow maps
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
