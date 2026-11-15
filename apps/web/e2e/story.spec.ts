import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { data } from './helpers';

const FREE = data.units.filter((u) => u.status === 'available').length;
const SEARCH = 'ชื่อโครงการหรือทำเล';
const SKIP = 'ข้ามไปค้นหา';
const INTRO_H1 = 'เลือกคอนโดผ่านตัวตึก 3 มิติ';

/** The device the intro sees: a strong one gets the live 3D, a weak one the stills (the CI runner has 2 cores, so this is pinned). */
const device = (page: Page, kind: 'strong' | 'weak') => page.addInitScript((k) => {
  Object.defineProperty(navigator, 'hardwareConcurrency', { value: k === 'strong' ? 8 : 2 });
  Object.defineProperty(navigator, 'deviceMemory', { value: k === 'strong' ? 8 : 2 });
}, kind);

/** Scrolls to a fraction (0..1) of the intro's own scroll length. */
const scrollTo = (page: Page, fraction: number) => page.evaluate((f) => {
  const track = document.querySelector('.story-track')!;
  const top = track.getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, top + (track.getBoundingClientRect().height - document.documentElement.clientHeight) * f);
}, fraction);

const introShown = (page: Page) => expect(page.getByRole('heading', { level: 1, name: INTRO_H1 })).toBeAttached();
/** After "skip": the search box is on screen with the cursor in it. */
const searchFocused = async (page: Page) => {
  const box = page.getByRole('textbox', { name: SEARCH });
  await expect(box).toBeInViewport();
  await expect(box).toBeFocused();
};

for (const [w, h] of [[320, 640], [390, 844], [1400, 900]] as const) {
  test(`ที่ ${w}×${h}: เห็นเรื่องเล่าเต็มจอ ช่องค้นหาไม่ซ้อนอยู่บนภาพ ปุ่มข้ามเห็นและเป็น Tab แรก ไม่เลื่อนแนวนอน`, async ({ page }) => {
    await device(page, 'weak');
    await page.setViewportSize({ width: w, height: h });
    await page.goto('');
    await introShown(page);
    await expect(page.getByRole('textbox', { name: SEARCH })).not.toBeInViewport(); // the search box is below the story
    const skip = page.getByRole('button', { name: SKIP });
    await expect(skip).toBeVisible();
    const box = await skip.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(w);
    await page.keyboard.press('Tab');
    await expect(skip).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
}

test('กดข้ามไปค้นหา: เลื่อนไปที่ช่องค้นหาและโฟกัสช่องแรก ไม่จำอะไรไว้ แล้วรีเฟรชก็เจอเรื่องเล่าอีก', async ({ page }) => {
  await device(page, 'weak');
  await page.goto('');
  await introShown(page);
  await page.getByRole('button', { name: SKIP }).click();
  await searchFocused(page);
  expect(await page.evaluate(() => localStorage.getItem('condoscope.intro'))).toBeNull();
  await page.reload();
  await introShown(page);
  await expect(page.getByRole('textbox', { name: SEARCH })).not.toBeInViewport();
});

test('บทสุดท้าย "เริ่มหาคอนโด" ไปที่ช่องค้นหาเหมือนปุ่มข้าม', async ({ page }) => {
  await device(page, 'weak');
  await page.goto('');
  await introShown(page);
  await scrollTo(page, 1);
  await expect(page.getByTestId('story-count')).toHaveText(String(FREE));
  await expect(page.getByText(`ห้องว่างรวมทุกโครงการ ${FREE} ห้อง`)).toBeAttached();
  await page.getByRole('button', { name: 'เริ่มหาคอนโด' }).click();
  await searchFocused(page);
});

test('เลื่อนผ่านเรื่องเล่าลงมาเอง: ปุ่มข้ามหายไป ช่องค้นหาและเนื้อหาเดิมของหน้าแรกอยู่ต่อท้าย', async ({ page }) => {
  await device(page, 'weak');
  await page.goto('');
  await introShown(page);
  await page.getByRole('textbox', { name: SEARCH }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: SKIP })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'โครงการทั้งหมด' })).toBeAttached();
});

for (const hash of ['#/search', '#/project/1', '#/explorer/1', '#/unit/1', '#/map', '#/reservations']) {
  test(`ลิงก์ตรง ${hash} ไม่เกี่ยวกับเรื่องเล่า`, async ({ page }) => {
    await device(page, 'weak');
    await page.route('https://tiles.openfreemap.org/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ version: 8, sources: {}, layers: [] }) }));
    await page.goto(hash);
    await expect(page.getByRole('main')).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page.getByRole('button', { name: SKIP })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: INTRO_H1 })).toHaveCount(0);
  });
}

test('ลดการเคลื่อนไหว: สไลด์นิ่ง ไม่มีเวทีปัก ไม่มี canvas ไม่โหลดโค้ด 3D ปุ่มข้ามใช้ได้', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const seenCode: string[] = [];
  page.on('request', (r) => { if (/Towers-|StoryScene-|Building3D-/.test(r.url())) seenCode.push(r.url()); });
  await page.goto('');
  const slides = page.getByRole('region', { name: 'แนะนำการใช้งานเว็บ' });
  await expect(slides.getByRole('listitem')).toHaveCount(6);
  expect(await page.locator('.story-track, .story-stage').count()).toBe(0);
  expect(await page.locator('canvas').count()).toBe(0);
  expect(await slides.evaluate((el) => [el, ...el.querySelectorAll('*')].some((e) => getComputedStyle(e).position === 'sticky'))).toBe(false);
  await expect(slides.getByTestId('story-count')).toHaveText(String(FREE));
  await page.waitForTimeout(1000);
  expect(seenCode).toEqual([]);
  await page.getByRole('button', { name: SKIP }).click();
  await searchFocused(page);
});

test('เครื่องอ่อน: ไม่ดาวน์โหลดโค้ด 3D เลยตอนเปิดหน้าและตอนเลื่อน', async ({ page }) => {
  await device(page, 'weak');
  const seenCode: string[] = [];
  page.on('request', (r) => { if (/Towers-|StoryScene-|Building3D-/.test(r.url())) seenCode.push(r.url()); });
  await page.goto('');
  await introShown(page);
  await scrollTo(page, 0.6);
  await page.waitForTimeout(1500);
  expect(seenCode).toEqual([]);
  expect(await page.locator('canvas').count()).toBe(0);
});

test('ภาพนิ่งขึ้นก่อนทันที แล้ว 3D ค่อยเข้ามาเมื่อโหลดเสร็จ (เครื่องแรง)', async ({ page }) => {
  await device(page, 'strong');
  await page.goto('');
  await expect(page.locator('img[src*="still-1"]').first()).toBeVisible();
  await expect(page.locator('.story-stage canvas')).toBeAttached({ timeout: 90_000 });
});

test('เข้ากลางเรื่อง (รีเฟรชกลาง intro): เวทีไม่ว่าง และตัวเลขอยู่ในช่วงที่ถูก', async ({ page }) => {
  await device(page, 'weak');
  await page.goto('');
  await introShown(page);
  await scrollTo(page, 0.6);
  await page.reload();
  await expect(page.locator('.story-stage')).toBeAttached();
  await scrollTo(page, 0.6);
  await page.waitForTimeout(800);
  const n = Number(await page.getByTestId('story-count').textContent());
  expect(n).toBeGreaterThanOrEqual(0);
  expect(n).toBeLessThanOrEqual(FREE);
  expect(await page.locator('.story-stage img').first().evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
});

test('ชิ้นโค้ด 3D โหลดไม่ได้: intro ยังมีภาพนิ่งและปุ่มข้าม ไม่ว่างเปล่า', async ({ page }) => {
  await device(page, 'strong');
  await page.route(/StoryScene-.*\.js/, (r) => r.abort());
  await page.goto('');
  await introShown(page);
  await scrollTo(page, 0.5);
  await page.waitForTimeout(1500);
  await expect(page.locator('.story-stage img[src*="still-"]').first()).toBeAttached();
  expect(await page.locator('canvas').count()).toBe(0);
  await expect(page.getByRole('button', { name: SKIP })).toBeVisible();
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
  await scrollTo(page, 0.2);
  await page.waitForTimeout(4000); // let the last frame finish
  const before = await page.evaluate(() => (window as unknown as { __draws: number }).__draws);
  expect(before).toBeGreaterThan(0);
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => (window as unknown as { __draws: number }).__draws)).toBe(before);
});

test('ไม่ล็อกการเลื่อน: คีย์บอร์ด PageDown/End ใช้ได้ และปุ่มข้ามยังกดได้กลางเรื่อง', async ({ page }) => {
  await device(page, 'weak');
  await page.goto('');
  await introShown(page);
  await page.keyboard.press('PageDown');
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 }).toBeGreaterThan(200);
  // PageDown scrolls by an animation, and Chromium drops an End pressed while it still runs (seen in a CI trace: scrollY stayed at exactly one page, 630 of a 720px window), so wait until it stops
  let last = -1;
  await expect.poll(async () => { const y = await page.evaluate(() => window.scrollY); const done = y === last; last = y; return done; }, { timeout: 10_000, intervals: [300] }).toBe(true);
  await page.keyboard.press('End');
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 }).toBeGreaterThan(1000);
  await scrollTo(page, 0.5);
  await page.getByRole('button', { name: SKIP }).click();
  await searchFocused(page);
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

test('ลดการเคลื่อนไหว: การ์ดไม่เรียก startViewTransition และยังไปหน้าโครงการได้', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    (window as unknown as { __vt: number }).__vt = 0;
    const real = document.startViewTransition?.bind(document);
    (document as unknown as { startViewTransition: unknown }).startViewTransition = (cb: () => void) => { (window as unknown as { __vt: number }).__vt++; return real!(cb); };
  });
  await page.goto('');
  await page.getByRole('article').first().getByRole('link', { name: 'ดูรายละเอียด' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __vt: number }).__vt)).toBe(0);
});

test('axe บนหน้าแรก (เรื่องเล่า ต้น/กลาง/ปลาย และส่วนค้นหา): ไม่มี serious/critical', async ({ page }) => {
  await device(page, 'weak');
  await page.goto('');
  await introShown(page);
  for (const f of [0, 0.5, 1, 'search'] as const) {
    if (f === 'search') await page.getByRole('button', { name: SKIP }).click(); else await scrollTo(page, f);
    await page.waitForTimeout(900);
    const result = await new AxeBuilder({ page }).exclude('canvas').analyze();
    const bad = result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(bad.map((v) => `${v.id} at ${f}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  }
});
