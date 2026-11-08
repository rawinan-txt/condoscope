import { mulberry32, type Dataset } from '@condoscope/shared';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const data: Dataset = JSON.parse(readFileSync(fileURLToPath(new URL('../src/data/fallback.json', import.meta.url)), 'utf8'));
const panelTitle = (page: Page) => page.locator('section[aria-label="รายละเอียดห้อง"] h2');

async function open3D(page: Page, projectId: number) {
  await page.goto(`#/explorer/${projectId}`);
  await page.waitForFunction(() => !!window.__condoscope, null, { timeout: 60_000 });
  await page.waitForTimeout(1500); // first frames + shadow maps
}

/** Up to n units of the project that are visible from the current camera, in a fixed pseudo-random order. */
async function visibleUnits(page: Page, projectId: number, n: number) {
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

for (const project of data.projects) {
  test(`เลือกห้องจากตึก 3D ได้ตรงห้อง — ${project.name}`, async ({ page }) => {
    await open3D(page, project.id);
    const picks = await visibleUnits(page, project.id, 5);
    expect(picks.length).toBe(5);
    for (const u of picks) {
      await page.mouse.click(u.x, u.y);
      await expect(panelTitle(page)).toHaveText(`ห้อง ${u.unit_number}`);
    }
  });
}

test('hover แสดง tooltip ตรงห้อง', async ({ page }) => {
  await open3D(page, 1);
  const [u] = await visibleUnits(page, 1, 1);
  await page.mouse.move(u.x - 3, u.y - 3);
  await page.mouse.move(u.x, u.y);
  await expect(page.getByRole('tooltip')).toContainText(u.unit_number);
});

test('ลากเพื่อหมุนแล้วปล่อยบนห้อง ไม่ถือว่าเลือกห้อง', async ({ page }) => {
  await open3D(page, 1);
  const [u] = await visibleUnits(page, 1, 1);
  await page.mouse.move(u.x, u.y);
  await page.mouse.down();
  await page.mouse.move(u.x + 60, u.y, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  await expect(panelTitle(page)).toHaveCount(0);
});

test('แสดงแบนเนอร์ข้อมูลสำรองและป้ายข้อมูลจำลอง', async ({ page }) => {
  await page.goto('#/explorer/1');
  await expect(page.getByText('Demo Fallback Mode')).toBeVisible();
  await expect(page.getByText('ข้อมูลจำลองเพื่อการสาธิต ไม่มีการขายจริง', { exact: false })).toBeVisible();
});

test('ภาพหน้าจอสำหรับ README', async ({ page }) => {
  await open3D(page, 1);
  const [u] = await visibleUnits(page, 1, 1);
  await page.mouse.click(u.x, u.y);
  await page.mouse.move(u.x, u.y);
  await page.waitForTimeout(500);
  await page.screenshot({ path: fileURLToPath(new URL('../../../docs/screenshots/explorer.png', import.meta.url)) });
});

test('@nogl เครื่องไม่มี WebGL ใช้ภาพตึก SVG ได้', async ({ page }) => {
  await page.goto('#/explorer/1');
  await expect(page.getByText('เครื่องนี้แสดง 3D ไม่ได้', { exact: false })).toBeVisible();
  const svg = page.getByRole('group', { name: /ภาพด้านหน้า/ });
  await svg.getByRole('button', { name: /^ห้อง A-1805 / }).click();
  await expect(panelTitle(page)).toHaveText('ห้อง A-1805');
});
