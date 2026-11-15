import AxeBuilder from '@axe-core/playwright';
import { buildExplorer } from '@condoscope/shared';
import { expect, test, type Page } from '@playwright/test';
import { storyOf } from '../src/features/story/story';
import { data, panelTitle } from './helpers';

const featured = data.projects.find((p) => p.is_featured)!;
const story = storyOf(buildExplorer(data, featured.id)!)!;
const SEARCH = 'ชื่อโครงการหรือทำเล';
const CTA = 'เข้าสำรวจตึกนี้';

/** The device the story sees: a strong one gets the live 3D, a weak one the stills (the CI runner has 2 cores, so this is pinned). */
const device = (page: Page, kind: 'strong' | 'weak') => page.addInitScript((k) => {
  Object.defineProperty(navigator, 'hardwareConcurrency', { value: k === 'strong' ? 8 : 2 });
  Object.defineProperty(navigator, 'deviceMemory', { value: k === 'strong' ? 8 : 2 });
}, kind);

/** Scrolls until the story has loaded (it waits until it is near) and returns its section. */
async function reachStory(page: Page) {
  await page.goto('');
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.8));
  const section = page.locator('section[aria-label^="เรื่องเล่า"]');
  await expect(section.getByRole('button', { name: 'ข้ามส่วนนี้' })).toBeAttached({ timeout: 30_000 });
  return section;
}

/** Scrolls to a fraction (0..1) of the story's own scroll length. */
const scrollStoryTo = (page: Page, fraction: number) => page.evaluate((f) => {
  const track = document.querySelector('.story-track')!;
  const top = track.getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, top + (track.getBoundingClientRect().height - document.documentElement.clientHeight) * f);
}, fraction);

for (const [w, h] of [[320, 640], [390, 844], [1400, 900]] as const) {
  test(`จอแรกที่ ${w}×${h}: ช่องค้นหาอยู่ในจอ ไม่มี canvas ไม่เลื่อนแนวนอน`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('');
    const box = await page.getByRole('textbox', { name: SEARCH }).boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(h);
    expect(await page.locator('canvas').count()).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
}

test('เลื่อนจนจบ: ตัวเลขห้องว่างตรงกับข้อมูล และปุ่มพาไปห้องที่เลือกใน Explorer', async ({ page }) => {
  await device(page, 'weak');
  const section = await reachStory(page);
  await scrollStoryTo(page, 1);
  await expect(section.getByTestId('story-count')).toHaveText(String(story.available));
  await expect(section.getByRole('link', { name: CTA })).toBeVisible();
  await section.getByRole('link', { name: CTA }).click();
  await expect(page).toHaveURL(new RegExp(`#/explorer/${featured.id}\\?unit=${story.unit.id}$`));
  await expect(panelTitle(page)).toHaveText(`ห้อง ${story.unit.unit_number}`, { timeout: 60_000 });
});

test('เข้ากลางเรื่อง (รีเฟรชกลางส่วน): เวทีไม่ว่าง และตัวเลขอยู่ในช่วงที่ถูก', async ({ page }) => {
  await device(page, 'weak');
  await reachStory(page);
  await scrollStoryTo(page, 0.65);
  await page.reload();
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.8));
  await expect(page.locator('.story-stage')).toBeAttached({ timeout: 30_000 });
  await scrollStoryTo(page, 0.65);
  const n = Number(await page.getByTestId('story-count').textContent());
  expect(n).toBeGreaterThanOrEqual(0);
  expect(n).toBeLessThanOrEqual(story.available);
  expect(await page.locator('.story-stage img').first().evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
});

test('ลดการเคลื่อนไหว: ไม่มีเวที ไม่มี canvas เห็นตัวเลขสุดท้ายและปุ่มทันที และการ์ดไม่เรียก startViewTransition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    (window as unknown as { __vt: number }).__vt = 0;
    const real = document.startViewTransition?.bind(document);
    (document as unknown as { startViewTransition: unknown }).startViewTransition = (cb: () => void) => { (window as unknown as { __vt: number }).__vt++; return real!(cb); };
  });
  const section = await reachStory(page);
  expect(await page.locator('.story-track, .story-stage').count()).toBe(0);
  expect(await page.locator('canvas').count()).toBe(0);
  expect(await section.evaluate((el) => [el, ...el.querySelectorAll('*')].some((e) => getComputedStyle(e).position === 'sticky'))).toBe(false);
  await expect(section.getByTestId('story-count')).toHaveText(String(story.available));
  await expect(section.getByRole('link', { name: CTA })).toBeVisible();
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

test('ชิ้นโค้ด 3D โหลดไม่ได้: เวทีสลับเป็นภาพนิ่ง ไม่ว่างเปล่า', async ({ page }) => {
  await device(page, 'strong');
  await page.route(/StoryScene-.*\.js/, (r) => r.abort());
  const section = await reachStory(page);
  await scrollStoryTo(page, 0.5);
  await expect(section.locator('.story-stage img[src*="still-"]').first()).toBeAttached();
  expect(await page.locator('canvas').count()).toBe(0);
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
  await reachStory(page);
  await scrollStoryTo(page, 0.3);
  await expect(page.locator('.story-stage canvas')).toBeAttached({ timeout: 90_000 });
  await page.waitForTimeout(4000); // let the last frame finish
  const before = await page.evaluate(() => (window as unknown as { __draws: number }).__draws);
  expect(before).toBeGreaterThan(0);
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => (window as unknown as { __draws: number }).__draws)).toBe(before);
});

test('คีย์บอร์ด: ปุ่มข้ามส่วนนี้เป็น Tab ตัวแรกของส่วน พาไปส่วนถัดไป และ End เลื่อนผ่านส่วนได้', async ({ page }) => {
  await device(page, 'weak');
  const section = await reachStory(page);
  await page.getByRole('textbox', { name: SEARCH }).focus();
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    if (await section.evaluate((s) => s.contains(document.activeElement))) break;
  }
  await expect(section.getByRole('button', { name: 'ข้ามส่วนนี้' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#story-end')).toBeFocused();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.keyboard.press('End');
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
});

test('axe บนหน้าแรกที่ต้น/กลาง/ปลายส่วนเล่าเรื่อง: ไม่มี serious/critical', async ({ page }) => {
  await device(page, 'weak');
  await reachStory(page);
  for (const f of [0, 0.5, 1]) {
    await scrollStoryTo(page, f);
    await page.waitForTimeout(700);
    const result = await new AxeBuilder({ page }).exclude('canvas').analyze();
    const bad = result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(bad.map((v) => `${v.id} at ${f}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  }
});
