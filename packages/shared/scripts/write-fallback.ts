import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generate } from '../src/generate';

const out = fileURLToPath(new URL('../../../apps/web/src/data/fallback.json', import.meta.url));
writeFileSync(out, JSON.stringify(generate()) + '\n');
console.log(`wrote ${out}`);
