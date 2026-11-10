// After `vite build`: checks that three.js, maplibre and the demo data stay out of the home page and that sizes are within budget.
// Run: npm run check:bundles -w web
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { evaluateBundles } from './bundle-rules.mjs';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const assets = `${dist}assets/`;
const files = readdirSync(assets).filter((f) => f.endsWith('.js'));
const read = (f) => readFileSync(assets + f, 'utf8');
const base = (p) => p.split('/').pop();

// start-up set: scripts named in index.html plus everything they import statically (dynamic import() is not followed)
const html = readFileSync(`${dist}index.html`, 'utf8');
const initial = new Set([...html.matchAll(/(?:src|href)="[^"]*\/assets\/([^"]+\.js)"/g)].map((m) => m[1]));
const STATIC_IMPORT = /(?:\bfrom|\bimport)\s*["']\.\/([^"']+\.js)["']/g;
for (const name of initial) {
  for (const m of read(name).matchAll(STATIC_IMPORT)) if (files.includes(base(m[1]))) initial.add(base(m[1]));
}

const chunks = files.map((name) => {
  const code = read(name);
  return { name, code, gzipBytes: gzipSync(code).length, initial: initial.has(name) };
});
for (const c of chunks) console.log(`${c.initial ? 'start ' : 'lazy  '} ${(c.gzipBytes / 1024).toFixed(1).padStart(7)} KB gzip  ${c.name}`);

const problems = evaluateBundles(chunks);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('\nbundles ok');
