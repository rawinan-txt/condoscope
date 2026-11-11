import { expect, test } from '@playwright/test';
import { open3D, visibleUnits } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

const noSideScroll = (page: import('@playwright/test').Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test('มือถือ: ตึกเต็มจอ แผงห้องย่ออยู่ แตะห้องแล้วเห็นสรุปห้องในแผง', async ({ page }) => {
  await open3D(page, 1);
  const sheet = page.getByRole('region', { name: 'แผงห้อง' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText(/แตะห้องบนตึก/)).toBeVisible();
  // peeking: the sheet is a thin strip, the building keeps the rest of the screen
  const box = (await sheet.boundingBox())!;
  expect(box.height).toBeLessThan(844 * 0.2);
  expect(await noSideScroll(page)).toBe(true);

  const [u] = await visibleUnits(page, 1, 1);
  await page.mouse.click(u.x, u.y);
  await expect(sheet.getByText(new RegExp(`ห้อง ${u.unit_number}`))).toBeVisible();
  await expect(sheet.getByRole('link', { name: 'ดูรายละเอียดห้อง' })).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'ขยายแผง' })).toHaveAttribute('aria-expanded', 'false');
});

test('มือถือ: ขยายแผง เลือกห้องจากรายการได้ และไม่มีแถบเลื่อนแนวนอน', async ({ page }) => {
  await open3D(page, 1);
  const sheet = page.getByRole('region', { name: 'แผงห้อง' });
  await sheet.getByRole('button', { name: 'ขยายแผง' }).click();
  await expect(sheet.getByRole('tablist')).toBeVisible();
  await sheet.getByRole('table').getByRole('button', { name: /^ห้อง A-3801 / }).click();
  await expect(sheet.getByRole('heading', { name: 'ห้อง A-3801' })).toBeVisible();
  expect(await noSideScroll(page)).toBe(true);
  await sheet.getByRole('button', { name: 'ย่อแผง' }).click();
  await expect(sheet.getByText(/ห้อง A-3801/)).toBeVisible();
});

test('มือถือ: ซ่อนแผงแล้วแสดงกลับได้ และตึกยังเลือกห้องได้เมื่อซ่อน', async ({ page }) => {
  await open3D(page, 1);
  await page.getByRole('region', { name: 'แผงห้อง' }).getByRole('button', { name: 'ซ่อนแผงห้อง' }).click();
  await expect(page.getByRole('region', { name: 'แผงห้อง' })).toHaveCount(0);
  const [u] = await visibleUnits(page, 1, 1);
  await page.mouse.click(u.x, u.y);
  // picking a room brings the sheet back as a peek
  await expect(page.getByRole('region', { name: 'แผงห้อง' }).getByText(new RegExp(`ห้อง ${u.unit_number}`))).toBeVisible();
});
