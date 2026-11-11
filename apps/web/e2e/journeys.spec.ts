import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { data, open3D, panelTitle, visibleUnits } from './helpers';

const NOTICE = 'ข้อมูลจำลองเพื่อการสาธิต ไม่มีการขายจริง';
// a tiny valid map style so the map tests do not depend on the internet or on OpenFreeMap being up
const MINIMAL_STYLE = { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#e8eef5' } }] };
const stubMapStyle = (page: Page) =>
  page.route('https://tiles.openfreemap.org/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MINIMAL_STYLE) }));

test('ทางเดินหลัก: หน้าแรก → ค้นหา → โครงการ → ตึก 3D → เลือกห้อง → รายละเอียดห้อง', async ({ page }) => {
  await page.goto('');
  await page.getByRole('textbox', { name: 'ชื่อโครงการหรือทำเล' }).fill('อารีย์');
  await page.getByRole('button', { name: 'ค้นหา' }).click();
  await expect(page).toHaveURL(/#\/search\?q=/);
  const cards = page.getByRole('article');
  await expect(cards).toHaveCount(1);
  await cards.first().getByRole('link', { name: 'ดูรายละเอียด' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Noventa Ari' })).toBeVisible();
  await page.getByRole('link', { name: 'เลือกห้องจากตัวอาคาร' }).click();
  await page.waitForFunction(() => !!window.__condoscope, null, { timeout: 60_000 });
  await page.waitForTimeout(1500);
  const [u] = await visibleUnits(page, 1, 1);
  await page.mouse.click(u.x, u.y);
  await expect(panelTitle(page)).toHaveText(`ห้อง ${u.unit_number}`);
  await page.getByRole('link', { name: 'ดูรายละเอียดห้อง' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`ห้อง ${u.unit_number}`);
});

test('URL ค้นหาที่เป็นขยะ: ยังเห็นโครงการ ไม่มีข้อความ error', async ({ page }) => {
  await page.goto(`#/search?minPrice=abc&limit=999&bedrooms=9&sort=x&foo=bar`);
  await expect(page.getByRole('article')).toHaveCount(5);
  await page.goto(`#/search?q=${'x'.repeat(500)}&maxPrice=1&minPrice=5`);
  await expect(page.getByText('ไม่พบโครงการที่ตรงเงื่อนไข')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('แผนที่: หมุด 5 ตัว กด Enter เปิด popup แล้วไปหน้าโครงการ', async ({ page }) => {
  await stubMapStyle(page);
  await page.goto('#/map');
  const markers = page.getByRole('button', { name: /^โครงการ / });
  await expect(markers).toHaveCount(5);
  await markers.first().focus();
  await page.keyboard.press('Enter');
  // decided with the owner: a pin leads to the project page (which has the button into the explorer), never straight to the explorer
  const popup = page.locator('.maplibregl-popup');
  await expect(popup.getByRole('link')).toHaveCount(1);
  await expect(popup.getByRole('link', { name: 'ดูโครงการ' })).toHaveAttribute('href', /^#\/project\/\d+$/);
  await page.getByRole('link', { name: 'ดูโครงการ' }).click();
  await expect(page).toHaveURL(/#\/project\/\d+$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('แผนที่: เข้า OpenFreeMap ไม่ได้ → แจ้งข้อความและเห็นรายการ เครดิตยังอยู่', async ({ page }) => {
  await page.route('https://tiles.openfreemap.org/**', (r) => r.abort());
  await page.goto('#/map');
  await expect(page.getByText('แผนที่โหลดไม่ได้ กำลังแสดงเป็นรายการแทน')).toBeVisible();
  await expect(page.getByRole('list', { name: 'รายการโครงการ' }).getByRole('listitem')).toHaveCount(5);
  await expect(page.getByRole('link', { name: 'OpenStreetMap' })).toBeVisible();
});

test.describe('มือถือ', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('เมนูและตัวกรองเปิด/ปิดได้ และไม่มีแถบเลื่อนแนวนอน', async ({ page }) => {
    await page.goto('');
    const menu = page.getByRole('button', { name: 'เมนู' });
    await menu.click();
    await expect(page.getByRole('navigation', { name: 'เมนูมือถือ' }).getByRole('link', { name: 'ค้นหาคอนโด' })).toBeVisible();
    await page.getByRole('navigation', { name: 'เมนูมือถือ' }).getByRole('link', { name: 'ค้นหาคอนโด' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'ค้นหาคอนโด' })).toBeVisible();
    const filters = page.getByRole('button', { name: /^ตัวกรอง/ });
    await expect(page.getByLabel('จังหวัด')).toBeHidden();
    await filters.click();
    await expect(page.getByLabel('จังหวัด')).toBeVisible();
    await filters.click();
    await expect(page.getByLabel('จังหวัด')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('แผนที่: สลับ แผนที่ / รายการ', async ({ page }) => {
    await stubMapStyle(page);
    await page.goto('#/map');
    const list = page.getByRole('list', { name: 'รายการโครงการ' });
    await expect(list).toBeHidden();
    await page.getByRole('button', { name: 'รายการ' }).click();
    await expect(list).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});

test('ทุกหน้ามีป้ายข้อมูลจำลอง', async ({ page }) => {
  await stubMapStyle(page);
  for (const hash of ['', '#/search', '#/project/1', '#/map', '#/unit/1', '#/reservations', '#/project/999999']) {
    await page.goto(hash);
    await expect(page.getByText(NOTICE, { exact: false }).first(), hash).toBeVisible();
  }
});

test.describe('การเข้าถึง (axe): ไม่มีปัญหาระดับ serious หรือ critical', () => {
  const pages = ['', '#/search', '#/project/1', '#/unit/1', '#/map', '#/reservations'];
  for (const hash of pages) {
    test(`หน้า ${hash || '#/'}`, async ({ page }) => {
      await stubMapStyle(page);
      await page.goto(hash);
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const result = await new AxeBuilder({ page }).exclude('.maplibregl-canvas').analyze();
      const bad = result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
    });
  }
});

test('ภาพโครงการและภาพห้องมาจากใต้ /condoscope/', async ({ page }) => {
  const bad: string[] = [];
  page.on('response', (r) => { if (r.url().includes('/images/') && !r.url().includes('/condoscope/images/')) bad.push(r.url()); });
  page.on('response', (r) => { if (r.status() === 404 && r.url().includes('/condoscope/')) bad.push(`404 ${r.url()}`); });
  await page.goto('#/project/1');
  await page.waitForLoadState('networkidle');
  await page.goto('#/unit/1');
  await page.waitForLoadState('networkidle');
  expect(bad).toEqual([]);
  expect(data.projects).toHaveLength(5);
});
