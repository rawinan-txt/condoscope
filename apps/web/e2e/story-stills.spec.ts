import { expect, test } from '@playwright/test';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { homeView, projectBounds } from '../src/features/explorer/scene/layout';
import { diveGoal, orbitPose } from '../src/features/story/poses';
import { STILL_AT } from '../src/features/story/stills';
import { storyOf } from '../src/features/story/story';
import { data, open3D } from './helpers';
import { buildExplorer } from '@condoscope/shared';

// Pictures for the "stills" tier of the story section: the same scene, camera at the story's poses. Only runs through `npm run story-stills`.
test.skip(!process.env.STORY_STILLS, 'run with npm run story-stills');
test.use({ viewport: { width: 1376, height: 774 }, storageState: { cookies: [], origins: [] } });

const dir = fileURLToPath(new URL('../public/images/story/', import.meta.url));

test('story stills from the featured project', async ({ page }) => {
  test.setTimeout(240_000);
  const project = data.projects.find((p) => p.is_featured)!;
  const payload = buildExplorer(data, project.id)!;
  const story = storyOf(payload)!;
  const bounds = projectBounds(payload.buildings);
  const end = orbitPose(bounds, 1);
  mkdirSync(dir, { recursive: true });
  await open3D(page, project.id);
  // the dusk look, no panels, no tooltips: only the tower and the city
  await page.getByRole('button', { name: 'พลบค่ำ' }).click();
  await page.addStyleTag({ content: '.glass, [role="tooltip"], [aria-label="ช่วงเวลา"], header, footer { visibility: hidden !important; }' });
  await page.waitForFunction(() => !window.__condoscope!.cameraBusy(), null, { timeout: 60_000 });
  for (const [i, p] of STILL_AT.entries()) {
    const pose = p < 0.72 ? orbitPose(bounds, p) : diveGoal(story.building, story.unit, p, end);
    // still 1 is the home view, as the story opens on it
    const at = i === 0 ? homeView(bounds) : pose;
    await page.evaluate(([a, b]) => window.__condoscope!.lookFrom(a, b), [at.position, at.target] as const);
    await page.waitForTimeout(2500);
    const png = await page.locator('canvas').screenshot({ type: 'png' });
    for (const [suffix, width] of [['', 1376], ['-sm', 720]] as const) {
      let quality = 80, out: Buffer;
      do { out = await sharp(png).resize({ width }).webp({ quality }).toBuffer(); quality -= 8; } while (out.length > 90 * 1024 && quality > 20);
      writeFileSync(`${dir}still-${i + 1}${suffix}.webp`, out); // the bytes as encoded: sharp.toFile would re-encode at quality 80
      expect(out.length).toBeLessThanOrEqual(90 * 1024);
    }
    console.log(`still-${i + 1}.webp ${Math.round(statSync(`${dir}still-${i + 1}.webp`).size / 1024)} KB`);
  }
});
