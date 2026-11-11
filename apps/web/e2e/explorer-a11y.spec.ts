import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { open3D, panelTitle, visibleUnits } from './helpers';

const live = (page: Page) => page.getByRole('status', { name: 'ประกาศการเลือกห้อง' });
const serious = async (page: Page) => {
  const result = await new AxeBuilder({ page }).exclude('canvas').analyze();
  const bad = result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  return bad.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`);
};

test('คีย์บอร์ด: ลำดับ Tab คือปุ่มมุมมอง → พื้นที่ตึก → แผงขวา', async ({ page }) => {
  await open3D(page, 1);
  await page.getByRole('link', { name: /กลับหน้าโครงการ/ }).focus();
  const names: string[] = [];
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    names.push(await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el?.getAttribute('aria-label') ?? el?.innerText?.trim() ?? '';
    }));
  }
  const at = (re: RegExp) => names.findIndex((n) => re.test(n));
  const view3d = at(/^ตึก 3D$/);
  const building = at(/^เลือกห้องจากตึก/);
  const panelToggle = at(/^ซ่อนแผง$/);
  expect([view3d, building, panelToggle].every((i) => i >= 0), names.join(' | ')).toBe(true);
  expect(view3d).toBeLessThan(building);
  expect(building).toBeLessThan(panelToggle);
});

test('คีย์บอร์ด: ลูกศรเลือกห้อง ประกาศให้ screen reader Enter เปิดหน้าห้อง Esc ล้าง', async ({ page }) => {
  await open3D(page, 1);
  await page.getByLabel(/เลือกห้องจากตึก/).focus();
  await page.keyboard.press('ArrowRight');
  const firstTitle = await panelTitle(page).innerText();
  await expect(live(page)).toContainText(firstTitle.replace('ห้อง ', 'เลือกห้อง '));
  await page.keyboard.press('ArrowUp');
  await expect(panelTitle(page)).not.toHaveText(firstTitle);
  await page.keyboard.press('Escape');
  await expect(panelTitle(page)).toHaveCount(0);
  await expect(live(page)).toHaveText('ล้างการเลือกห้อง');
  await page.keyboard.press('ArrowRight');
  const picked = await panelTitle(page).innerText();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(picked);
});

test.describe('การเข้าถึง (axe) ของ Explorer: ไม่มีปัญหาระดับ serious หรือ critical', () => {
  test('desktop ยังไม่เลือกห้อง', async ({ page }) => {
    await open3D(page, 1);
    expect(await serious(page)).toEqual([]);
  });

  test('desktop เลือกห้องแล้ว แผงเปิด และแท็บตัวกรอง', async ({ page }) => {
    await open3D(page, 1);
    const [u] = await visibleUnits(page, 1, 1);
    await page.mouse.click(u.x, u.y);
    await expect(panelTitle(page)).toHaveText(`ห้อง ${u.unit_number}`);
    await page.getByRole('tab', { name: 'ตัวกรอง' }).click();
    expect(await serious(page)).toEqual([]);
  });

  test.describe('มือถือ', () => {
    test.use({ viewport: { width: 390, height: 844 } });
    test('แผงย่อและแผงขยาย', async ({ page }) => {
      await open3D(page, 1);
      expect(await serious(page)).toEqual([]);
      await page.getByRole('button', { name: 'ขยายแผง' }).click();
      expect(await serious(page)).toEqual([]);
    });
  });
});
