// Usage: node scripts/smoke-live.mjs <apiUrl>   e.g. http://localhost:8788 or https://condoscope-api.<you>.workers.dev
// Calls three endpoints as the GitHub Pages site would and prints what a deploy needs to verify.
const ORIGIN = 'https://rawinan-txt.github.io';
const base = (process.argv[2] ?? '').replace(/\/$/, '');
if (!/^https?:\/\//.test(base)) {
  console.error('Usage: node scripts/smoke-live.mjs <apiUrl>');
  process.exit(2);
}

let failed = false;
for (const path of ['/api/health', '/api/projects', '/api/projects/1/explorer']) {
  const t0 = performance.now();
  try {
    const res = await fetch(base + path, { headers: { Origin: ORIGIN } });
    const bytes = (await res.arrayBuffer()).byteLength;
    const ms = Math.round(performance.now() - t0);
    const h = (n) => res.headers.get(n) ?? '-';
    const acao = h('access-control-allow-origin');
    const ok = res.status === 200 && (acao === ORIGIN || acao === '*');
    if (!ok) failed = true;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${path} status=${res.status} bytes=${bytes} ${ms}ms cache-control="${h('cache-control')}" cf-cache-status=${h('cf-cache-status')} acao=${acao}`);
  } catch (e) {
    failed = true;
    console.log(`FAIL ${path} ${e.message}`);
  }
}
process.exit(failed ? 1 : 0);
