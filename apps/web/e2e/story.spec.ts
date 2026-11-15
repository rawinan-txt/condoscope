import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { data } from './helpers';

const FREE = data.units.filter((u) => u.status === 'available').length;
const SEARCH = 'ชื่อโครงการหรือทำเล';

/** The device the story sees: a strong one gets the live 3D, a weak one the stills (the CI runner has 2 cores, so this is pinned). */
const device = (page: Page, kind: 'strong' | 'weak') => page.addInitScript((k) => {
  Object.defineProperty(navigator, 'hardwareConcurrency', { value: k === 'strong' ? 8 : 2 });
  Object.defineProperty(navigator, 'deviceMemory', { value: k === 'strong' ? 8 : 2 });
}, kind);

/** Scrolls to a fraction (0..1) of the story's own scroll length. */
const scrollStoryTo = (page: Page, fraction: number) => page.evaluate((f) => {
  const track = document.querySelector('.story-track')!;
  const top = track.getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, top + (track.getBoundingClientRect().height - document.documentElement.clientHeight) * f);
}, fraction);

for (const [w, h] of [[320, 640], [390, 844], [1400, 900]] as const) {
  test(`จอแรกที่ ${w}×${h}: ช่องค้นหาลอยบนภาพ อยู่ในจอ และใช้ได้ทันที ไม่เลื่อนแนวนอน`, async ({ page }) => {
    await device(page, 'weak');
    await page.setViewportSize({ width: w, height: h });
    await page.goto('');
    const box = page.getByRole('textbox', { name: SEARCH });
    const rect = await box.boundingBox();
    expect(rect!.y).toBeGreaterThanOrEqual(0);
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(h);
    const button = await page.getByRole('button', { name: 'ค้นหา' }).boundingBox();
    expect(button!.y + button!.height).toBeLessThanOrEqual(h);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    await box.fill('อารีย์');
    await page.getByRole('button', { name: 'ค้นหา' }).click();
    await expect(page).toHaveURL(/#\/search\?q=/);
  });
}

test('ภาพนิ่งขึ้นก่อนทันที แล้ว 3D ค่อยเข้ามาเมื่อโหลดเสร็จ (เครื่องแรง)', async ({ page }) => {
  await device(page, 'strong');
  await page.goto('');
  await expect(page.locator('.story-stage img[src*="still-1"]')).toBeVisible();
  await expect(page.locator('.story-stage canvas')).toBeAttached({ timeout: 90_000 });
});

test('เครื่องอ่อน: ไม่ดาวน์โหลดโค้ด 3D เลยตอนเปิดหน้าและตอนเลื่อน', async ({ page }) => {
  await device(page, 'weak');
  const seen: string[] = [];
  page.on('request', (r) => { if (/Towers-|StoryScene-|Building3D-/.test(r.url())) seen.push(r.url()); });
  await page.goto('');
  await expect(page.locator('.story-stage')).toBeVisible();
  await scrollStoryTo(page, 0.6);
  await page.waitForTimeout(1500);
  expect(seen).toEqual([]);
  expect(await page.locator('canvas').count()).toBe(0);
});

test('เลื่อนจนจบ: ตัวเลขห้องว่างรวมตรงกับข้อมูลทั้งระบบ และปุ่มท้ายเรื่องใช้ได้', async ({ page }) => {
  await device(page, 'weak');
  await page.goto('');
  await scrollStoryTo(page, 1);
  await expect(page.getByTestId('story-count')).toHaveText(String(FREE));
  await expect(page.getByText(`ห้องว่างรวมทุกโครงการ ${FREE} ห้อง`)).toBeAttached();
  await page.locator('.story-stage').getByRole('link', { name: 'ลองดูตึก 3 มิติ' }).click();
  await expect(page).toHaveURL(/#\/explorer\/\d+/);
});

test('เข้ากลางเรื่อง (รีเฟรชกลางส่วน): เวทีไม่ว่าง และตัวเลขอยู่ในช่วงที่ถูก', async ({ page }) => {
  await device(page, 'weak');
  await page.goto('');
  await scrollStoryTo(page, 0.6);
  await page.reload();
  await expect(page.locator('.story-stage')).toBeAttached();
  await scrollStoryTo(page, 0.6);
  await page.waitForTimeout(800);
  const n = Number(await page.getByTestId('story-count').textContent());
  expect(n).toBeGreaterThanOrEqual(0);
  expect(n).toBeLessThanOrEqual(FREE);
  expect(await page.locator('.story-stage img').first().evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
});

test('ลดการเคลื่อนไหว: ภาพนิ่ง + เนื้อหานิ่ง ไม่มีเวทีปัก ไม่มี canvas เห็นตัวเลขสุดท้ายทันที และการ์ดไม่เรียก startViewTransition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    (window as unknown as { __vt: number }).__vt = 0;
    const real = document.startViewTransition?.bind(document);
    (document as unknown as { startViewTransition: unknown }).startViewTransition = (cb: () => void) => { (window as unknown as { __vt: number }).__vt++; return real!(cb); };
  });
  await page.goto('');
  await expect(page.getByRole('textbox', { name: SEARCH })).toBeVisible();
  expect(await page.locator('.story-track, .story-stage').count()).toBe(0);
  expect(await page.locator('canvas').count()).toBe(0);
  const steps = page.getByRole('region', { name: 'วิธีใช้งานเว็บนี้' });
  expect(await steps.evaluate((el) => [el, ...el.querySelectorAll('*')].some((e) => getComputedStyle(e).position === 'sticky'))).toBe(false);
  await expect(steps.getByTestId('story-count')).toHaveText(String(FREE));
  await expect(steps.getByRole('link', { name: 'เริ่มค้นหาคอนโด' })).toBeVisible();
  await page.getByRole('article').first().getByRole('link', { name: 'ดูรายละเอียด' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __vt: number }).__vt)).toBe(0);
});

test('การ์ด → หน้าโครงการ เรียก startViewTransition เมื่อไม่ลดการเคลื่อนไหว (HashRouter ใช้ได้จริงในเบราว์เซอร์)', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __vt: number }).__vt = 0;
    const real = document.startViewTransition.bind(document);
    (document as unknown as { startViewTransition: unknown }).startViewTransition = (cb: () => void) => { (window as unknown as { __vt: number }).__vt++; return real(cb); };
  });
  await page.goto('');
  await page.getByRole('article').first().getByRole('link', { name: 'ดูรายละเอียด' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __vt: number }).__vt)).toBe(1);
});

test('ชิ้นโค้ด 3D โหลดไม่ได้: จอแรกยังมีภาพนิ่งและช่องค้นหา ไม่ว่างเปล่า', async ({ page }) => {
  await device(page, 'strong');
  await page.route(/StoryScene-.*\.js/, (r) => r.abort());
  await page.goto('');
  await scrollStoryTo(page, 0.5);
  await page.waitForTimeout(1500);
  await expect(page.locator('.story-stage img[src*="still-"]').first()).toBeAttached();
  expect(await page.locator('canvas').count()).toBe(0);
  await scrollStoryTo(page, 0);
  await expect(page.getByRole('textbox', { name: SEARCH })).toBeVisible();
});

test('3D ไม่วาดซ้ำเมื่อหยุดเลื่อน', async ({ page }) => {
  test.setTimeout(180_000);
  await device(page, 'strong');
  await page.addInitScript(() => {
    const w = window as unknown as { __draws: number };
    w.__draws = 0;
    for (const name of ['drawElements', 'drawElementsInstanced', 'drawArrays', 'drawArraysInstanced'] as const) {
      const proto = WebGL2RenderingContext.prototype as unknown as Record<string, (...a: unknown[]) => unknown>;
      const real = proto[name];
      proto[name] = function (this: unknown, ...a: unknown[]) { w.__draws++; return real.apply(this, a); };
    }
  });
  await page.goto('');
  await expect(page.locator('.story-stage canvas')).toBeAttached({ timeout: 90_000 });
  await scrollStoryTo(page, 0.2);
  await page.waitForTimeout(4000); // let the last frame finish
  const before = await page.evaluate(() => (window as unknown as { __draws: number }).__draws);
  expect(before).toBeGreaterThan(0);
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => (window as unknown as { __draws: number }).__draws)).toBe(before);
});

test('คีย์บอร์ด: Tab ผ่านช่องค้นหาไปปุ่มข้ามส่วนนี้ ซึ่งพาไปส่วนถัดไป และ End เลื่อนผ่านส่วนได้', async ({ page }) => {
  await device(page, 'weak');
  await page.goto('');
  await page.getByRole('button', { name: 'ค้นหา' }).focus();
  await page.keyboard.press('Tab'); // the details summary of extra filters
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'ข้ามส่วนนี้' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#story-end')).toBeFocused();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.keyboard.press('End');
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 }).toBeGreaterThan(1000); // smooth scrolling takes a moment
});

test('ช่องค้นหาที่จางหายแล้ว (เลื่อนไปกลางเรื่อง) โฟกัสไม่ได้ และกลับมาใช้ได้เมื่อเลื่อนขึ้นสุด', async ({ page }) => {
  await device(page, 'weak');
  await page.goto('');
  await scrollStoryTo(page, 0.5);
  await page.waitForTimeout(500);
  // faded out and inert: it cannot take the focus (a keyboard user would otherwise type into something invisible)
  expect(await page.evaluate(() => { const el = document.querySelector<HTMLInputElement>('.story-stage input[type=text]')!; el.focus(); return document.activeElement === el; })).toBe(false);
  await scrollStoryTo(page, 0);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => { const el = document.querySelector<HTMLInputElement>('.story-stage input[type=text]')!; el.focus(); return document.activeElement === el; })).toBe(true);
});

test('axe บนหน้าแรกที่ต้น/กลาง/ปลายเรื่อง: ไม่มี serious/critical', async ({ page }) => {
  await device(page, 'weak');
  await page.goto('');
  for (const f of [0, 0.5, 1]) {
    await scrollStoryTo(page, f);
    await page.waitForTimeout(900);
    const result = await new AxeBuilder({ page }).exclude('canvas').analyze();
    const bad = result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(bad.map((v) => `${v.id} at ${f}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  }
});
