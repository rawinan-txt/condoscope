import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { open3D, panelTitle, visibleUnits } from './helpers';

// README pictures. Only runs through `npm run screenshots` (SCREENSHOTS=1) so normal e2e runs do not rewrite tracked files.
test.skip(!process.env.SCREENSHOTS, 'run with npm run screenshots');

const dir = fileURLToPath(new URL('../../../docs/screenshots/', import.meta.url));
const shot = (page: import('@playwright/test').Page, name: string) => page.screenshot({ path: `${dir}${name}.png` });
const MINIMAL_STYLE = { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#e8eef5' } }] };

test('ภาพหน้าจอ 6 หน้าสำหรับ README', async ({ page }) => {
  mkdirSync(dir, { recursive: true });
  await page.route('https://tiles.openfreemap.org/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MINIMAL_STYLE) }));

  await page.goto('');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.waitForLoadState('networkidle');
  await shot(page, 'home');

  await page.goto('#/search');
  await expect(page.getByRole('article').first()).toBeVisible();
  await page.waitForLoadState('networkidle');
  await shot(page, 'search');

  await page.goto('#/project/1');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800); // image fade-in
  await shot(page, 'project');

  await page.goto('#/map');
  await expect(page.getByRole('button', { name: /^โครงการ / })).toHaveCount(5);
  await page.waitForTimeout(800);
  await shot(page, 'map');

  await open3D(page, 1);
  const [u] = await visibleUnits(page, 1, 1);
  await page.mouse.click(u.x, u.y);
  await expect(panelTitle(page)).toHaveText(`ห้อง ${u.unit_number}`);
  await page.mouse.move(u.x, u.y);
  await page.waitForTimeout(500);
  await shot(page, 'explorer');

  await page.goto(`#/unit/${u.id}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`ห้อง ${u.unit_number}`);
  await page.waitForLoadState('networkidle');
  await shot(page, 'unit');
});
