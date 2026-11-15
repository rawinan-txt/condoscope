// Retakes the four pictures of the story section's "stills" tier into public/images/story/ (local API + built web app, same setup as the e2e tests).
// Run: npm run story-stills
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const e2e = fileURLToPath(new URL('./e2e.mjs', import.meta.url));
const r = spawnSync(process.execPath, [e2e, 'story-stills.spec.ts', '--reporter=list'], { env: { ...process.env, STORY_STILLS: '1' }, stdio: 'inherit' });
process.exit(r.status ?? 1);
