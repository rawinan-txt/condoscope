// One command for the browser tests: fresh local API database → build the web app against that API → Playwright.
// Ports can be changed with E2E_PORT (web preview, default 4321) and E2E_API_PORT (API, default 8788): on Windows a
// stopped Playwright run may leave its servers behind, and a new port avoids "address already in use".
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const apiPort = process.env.E2E_API_PORT ?? '8788';
const env = { ...process.env, E2E_API_PORT: apiPort, VITE_API_URL: `http://localhost:${apiPort}` };
const web = fileURLToPath(new URL('..', import.meta.url));
const api = fileURLToPath(new URL('../../api', import.meta.url));
const bin = (p) => fileURLToPath(new URL(`../../../node_modules/${p}`, import.meta.url));

function run(cwd, args) {
  const r = spawnSync(process.execPath, args, { cwd, env, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run(api, ['scripts/db.mjs', 'e2e']);
run(web, [bin('vite/bin/vite.js'), 'build']);
run(web, [bin('@playwright/test/cli.js'), 'test', ...process.argv.slice(2)]);
