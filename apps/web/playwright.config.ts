import { defineConfig } from '@playwright/test';

// Software WebGL so the 3D tests run on machines and CI runners without a GPU.
// shortcut: Playwright on Windows can leave its servers running; E2E_PORT / E2E_API_PORT let a rerun pick free ports
const PORT = Number(process.env.E2E_PORT ?? 4321);
const API_PORT = Number(process.env.E2E_API_PORT ?? 8788);
const SOFT_GL = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  use: { baseURL: `http://localhost:${PORT}/condoscope/`, viewport: { width: 1400, height: 900 }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', grepInvert: /@nogl/, use: { browserName: 'chromium', launchOptions: { args: SOFT_GL } } },
    { name: 'chromium-nogl', grep: /@nogl/, use: { browserName: 'chromium', launchOptions: { args: ['--disable-webgl', '--disable-webgl2', '--disable-gpu'] } } },
  ],
  // Both servers are started as one plain node process (no npm wrapper) so Playwright can stop them on Windows.
  // `npm run e2e` (scripts/e2e.mjs) prepares the database and builds the web app first.
  webServer: [
    {
      command: `node ../../node_modules/vite/bin/vite.js preview --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}/condoscope/`,
      reuseExistingServer: false,
      timeout: 180_000,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
    },
    {
      command: `node ../../node_modules/wrangler/bin/wrangler.js dev --port ${API_PORT} --persist-to .wrangler/e2e-${API_PORT}`,
      cwd: '../api',
      url: `http://localhost:${API_PORT}/api/health`,
      reuseExistingServer: false,
      timeout: 180_000,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
    },
  ],
});
