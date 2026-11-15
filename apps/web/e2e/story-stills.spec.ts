import { buildExplorer } from '@condoscope/shared';
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { projectBounds } from '../src/features/explorer/scene/layout';
import { scenePose } from '../src/features/story/poses';
import { pickStoryProjects, storyOf } from '../src/features/story/story';
import { STILL_AT } from '../src/features/story/stills';
import { orbitDegrees, sceneAt } from '../src/features/story/timeline';
import { data, open3D } from './helpers';

// Pictures for the "stills" tier and for the very first screen: the same scenes, camera at the story's poses, three different projects.
// Only runs through `npm run story-stills`.
test.skip(!process.env.STORY_STILLS, 'run with npm run story-stills');
test.use({ viewport: { width: 1376, height: 774 }, storageState: { cookies: [], origins: [] } });

const dir = fileURLToPath(new URL('../public/images/story/', import.meta.url));

async function clean(page: Page, projectId: number) {
  await open3D(page, projectId);
  // the dusk look, no panels, no tooltips: only the tower and the city
  await page.getByRole('button', { name: 'พลบค่ำ' }).click();
  await page.addStyleTag({ content: '.glass, [role="tooltip"], [aria-label="ช่วงเวลา"], header, footer { visibility: hidden !important; }' });
  await page.waitForFunction(() => !window.__condoscope!.cameraBusy(), null, { timeout: 60_000 });
}

test('story stills from three projects', async ({ browser }) => {
  test.setTimeout(480_000);
  mkdirSync(dir, { recursive: true });
  const picks = pickStoryProjects(data.projects);
  for (const [i, p] of STILL_AT.entries()) {
    const scene = sceneAt(p);
    const project = picks[scene];
    const payload = buildExplorer(data, project.id)!;
    const story = storyOf(payload)!;
    const bounds = projectBounds(payload.buildings);
    const pose = scenePose(scene, bounds, story, p);
    // a fresh page each time: the style that hides the panels would also hide the controls of the next project
    const context = await browser.newContext({ viewport: { width: 1376, height: 774 } });
    const page = await context.newPage();
    await clean(page, project.id);
    await page.evaluate(([a, b]) => window.__condoscope!.lookFrom(a, b), [pose.position, pose.target] as const);
    await page.waitForTimeout(2500);
    const png = await page.locator('canvas').screenshot({ type: 'png' });
    for (const [suffix, width] of [['', 1376], ['-sm', 720]] as const) {
      let quality = 80, out: Buffer;
      do { out = await sharp(png).resize({ width }).webp({ quality }).toBuffer(); quality -= 8; } while (out.length > 90 * 1024 && quality > 20);
      writeFileSync(`${dir}still-${i + 1}${suffix}.webp`, out); // the bytes as encoded: sharp.toFile would re-encode at quality 80
      expect(out.length).toBeLessThanOrEqual(90 * 1024);
    }
    await context.close();
    console.log(`still-${i + 1} ${project.name} scene ${scene} orbit ${Math.round(orbitDegrees(p))}deg ${Math.round(statSync(`${dir}still-${i + 1}.webp`).size / 1024)} KB`);
  }
});
