// Takes one JPEG per project from the 3D explorer (dusk, default camera) into public/images/projects/<slug>.jpg.
// Uses the bundled demo data (no API needed). Software WebGL, like the e2e tests. Run: npm run thumbnails
import { chromium } from '@playwright/test';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const web = fileURLToPath(new URL('..', import.meta.url));
const vite = fileURLToPath(new URL('../../../node_modules/vite/bin/vite.js', import.meta.url));
const outDir = fileURLToPath(new URL('../public/images/projects/', import.meta.url));
const port = process.env.THUMB_PORT ?? '4381';
const env = { ...process.env, VITE_API_URL: '' }; // demo data only

const build = spawnSync(process.execPath, [vite, 'build'], { cwd: web, env, stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);

const server = spawn(process.execPath, [vite, 'preview', '--port', port, '--strictPort'], { cwd: web, env, stdio: 'ignore' });
const base = `http://localhost:${port}/condoscope/`;
try {
  for (let i = 0; i < 60; i++) {
    if (await fetch(base).then((r) => r.ok, () => false)) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  const { projects } = JSON.parse(readFileSync(new URL('../src/data/fallback.json', import.meta.url), 'utf8'));
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  for (const p of projects) {
    await page.goto(`${base}#/explorer/${p.id}`);
    await page.waitForFunction(() => !!window.__condoscope, null, { timeout: 60_000 });
    // the day/dusk switch and any tooltip are UI, not part of the picture
    await page.addStyleTag({ content: '[aria-label="ช่วงเวลา"], [role="tooltip"], .glass { visibility: hidden !important; }' });
    await page.waitForTimeout(3000); // first frames, shadows, bloom
    const path = `${outDir}${p.slug}.jpg`;
    await page.locator('canvas').screenshot({ path, type: 'jpeg', quality: 80 });
    console.log(`${p.slug}.jpg  ${Math.round(statSync(path).size / 1024)} KB`);
  }
  await browser.close();
} finally {
  server.kill();
}
