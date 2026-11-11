import { expect, test } from '@playwright/test';
import { data, open3D, panelTitle, visibleUnits } from './helpers';

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

const MOCK_NOTICE = 'ข้อมูลจำลองเพื่อการสาธิต ไม่มีการขายจริง';
const BANNER = 'Demo Fallback Mode';

test('API จริง: ไม่มีแบนเนอร์ fallback, เรียก API ครั้งเดียว และไม่โหลด fallback.json', async ({ page }) => {
  const requested: string[] = [];
  page.on('request', (r) => requested.push(r.url()));
  await page.goto('#/explorer/1');
  await page.waitForFunction(() => !!window.__condoscope, null, { timeout: 60_000 });
  await expect(page.getByText(BANNER)).toHaveCount(0);
  await expect(page.getByText(MOCK_NOTICE, { exact: false })).toBeVisible();
  expect(requested.filter((u) => /\/api\/projects\/1\/explorer$/.test(u))).toHaveLength(1);
  expect(requested.some((u) => /fallback-[\w-]+\.js/.test(u))).toBe(false);
});

const DOWN: [string, (r: import('@playwright/test').Route) => Promise<void>][] = [
  ['เครือข่ายล้ม', (r) => r.abort()],
  ['HTTP 500', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":{"code":"INTERNAL","message":"x"}}' })],
  ['200 เป็นหน้า HTML', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>404</title>' })],
];
for (const [name, handler] of DOWN) {
  test(`API ล่ม (${name}): แบนเนอร์ขึ้น และยังเลือกห้องจากตึกได้ตรงห้อง`, async ({ page }) => {
    await page.route('**/api/**', handler);
    await open3D(page, 1);
    await expect(page.getByText(BANNER)).toBeVisible();
    await expect(page.getByText(MOCK_NOTICE, { exact: false })).toBeVisible();
    const [u] = await visibleUnits(page, 1, 1);
    await page.mouse.click(u.x, u.y);
    await expect(panelTitle(page)).toHaveText(`ห้อง ${u.unit_number}`);
  });
}

test('ห้องที่ไม่มีอยู่ (API จริง): "ไม่พบข้อมูล" ไม่ใช่ fallback', async ({ page }) => {
  await page.goto('#/unit/999999');
  await expect(page.getByRole('heading', { name: 'ไม่พบข้อมูล' })).toBeVisible();
  await expect(page.getByText(BANNER)).toHaveCount(0);
});

test('@nogl เครื่องไม่มี WebGL ใช้ภาพตึก SVG ได้', async ({ page }) => {
  await page.goto('#/explorer/1');
  await expect(page.getByText('เครื่องนี้แสดง 3D ไม่ได้', { exact: false })).toBeVisible();
  const svg = page.getByRole('group', { name: /ภาพด้านหน้า/ });
  await svg.getByRole('button', { name: /^ห้อง A-1805 / }).click();
  await expect(panelTitle(page)).toHaveText('ห้อง A-1805');
});

test('คลิกห้อง → ดูรายละเอียด → hotspot → กลับไปเลือกห้องอื่น', async ({ page }) => {
  await open3D(page, 1);
  const [a, b] = await visibleUnits(page, 1, 2);
  await page.mouse.click(a.x, a.y);
  await page.getByRole('link', { name: 'ดูรายละเอียดห้อง' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`ห้อง ${a.unit_number}`);
  const plan = page.getByRole('group', { name: 'แปลนห้อง' });
  await plan.getByRole('button', { name: 'ดูภาพ ครัว' }).click();
  await expect(page.getByRole('figure')).toContainText('ครัว');
  await page.getByRole('link', { name: 'กลับไปเลือกห้อง' }).click();
  await expect(panelTitle(page)).toHaveText(`ห้อง ${a.unit_number}`);
  await page.waitForFunction(() => !!window.__condoscope, null, { timeout: 60_000 });
  await page.waitForTimeout(1500);
  const p = await page.evaluate((id) => window.__condoscope!.projectUnit(id), b.id);
  expect(p).not.toBeNull();
  await page.mouse.click(p!.x, p!.y);
  await expect(panelTitle(page)).toHaveText(`ห้อง ${b.unit_number}`);
});

test('เลือกห้องด้านหลังตึกจากรายการ กล้องหมุนไปให้เห็นห้องนั้น', async ({ page }) => {
  await open3D(page, 1);
  const back = data.units.find((u) => u.building_id === 1 && u.facade === 'back' && u.unit_number.startsWith('A-20'))!;
  expect(await page.evaluate((id) => window.__condoscope!.projectUnit(id), back.id)).toBeNull(); // hidden from the start view
  await page.getByRole('table').getByRole('button', { name: new RegExp(`^ห้อง ${back.unit_number} `) }).click();
  await expect.poll(() => page.evaluate((id) => window.__condoscope!.projectUnit(id), back.id), { timeout: 10_000 }).not.toBeNull();
  const p = (await page.evaluate((id) => window.__condoscope!.projectUnit(id), back.id))!;
  await page.mouse.click(p.x, p.y);
  await expect(panelTitle(page)).toHaveText(`ห้อง ${back.unit_number}`);
});

test('ห้องที่อยู่ใต้แผงลอยไม่ถูกนับว่ามองเห็น (จอแคบ แผงทับตึก)', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 700 });
  await open3D(page, 1);
  const buildingIds = new Set(data.buildings.filter((b) => b.project_id === 1).map((b) => b.id));
  const ids = data.units.filter((u) => buildingIds.has(u.building_id)).map((u) => u.id);
  const result = await page.evaluate((all) => {
    let visible = 0;
    const underPanel: number[] = [];
    for (const id of all) {
      const p = window.__condoscope!.projectUnit(id);
      if (!p) continue;
      visible++;
      const el = document.elementFromPoint(p.x, p.y);
      if (!el || el.tagName !== 'CANVAS') underPanel.push(id);
    }
    return { visible, underPanel };
  }, ids);
  expect(result.visible).toBeGreaterThan(20);
  expect(result.underPanel).toEqual([]);
});
