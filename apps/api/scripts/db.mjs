// Local D1 helper (cross-platform, no shell tricks).
//   node scripts/db.mjs reset  → fresh local dev database in .wrangler/state (what `npm run api:dev` serves)
//   node scripts/db.mjs e2e    → fresh database for Playwright in .wrangler/e2e-<E2E_API_PORT>
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const wrangler = fileURLToPath(new URL('../../../node_modules/wrangler/bin/wrangler.js', import.meta.url));
const mode = process.argv[2];
if (mode !== 'reset' && mode !== 'e2e') {
  console.error('usage: node scripts/db.mjs <reset|e2e>');
  process.exit(2);
}
const persist = mode === 'e2e' ? `.wrangler/e2e-${process.env.E2E_API_PORT ?? '8788'}` : '.wrangler/state';

rmSync(persist, { recursive: true, force: true });
const run = (...args) => execFileSync(process.execPath, [wrangler, ...args, '--local', '--persist-to', persist], { stdio: 'inherit' });
run('d1', 'migrations', 'apply', 'condoscope');
run('d1', 'execute', 'condoscope', '--file', '../../database/seeds/seed.sql');
