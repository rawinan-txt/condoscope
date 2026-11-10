// Retakes the six README pictures in docs/screenshots/ (fresh local API + built web app, same setup as the e2e tests).
// Run: npm run screenshots   (ports: E2E_PORT / E2E_API_PORT, see e2e.mjs)
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const e2e = fileURLToPath(new URL('./e2e.mjs', import.meta.url));
const r = spawnSync(process.execPath, [e2e, 'screenshots.spec.ts', '--reporter=list'], { env: { ...process.env, SCREENSHOTS: '1' }, stdio: 'inherit' });
process.exit(r.status ?? 1);
