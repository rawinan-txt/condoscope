import { defineConfig } from '@playwright/test';

// Software WebGL so the 3D tests run on machines and CI runners without a GPU.
// shortcut: Playwright on Windows can leave the preview server running; E2E_PORT lets a rerun pick a free port
const PORT = Number(process.env.E2E_PORT ?? 4321);
const SOFT_GL = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  use: { baseURL: `http://localhost:${PORT}/condoscope/`, viewport: { width: 1400, height: 900 } },
  projects: [
    { name: 'chromium', grepInvert: /@nogl/, use: { browserName: 'chromium', launchOptions: { args: SOFT_GL } } },
    { name: 'chromium-nogl', grep: /@nogl/, use: { browserName: 'chromium', launchOptions: { args: ['--disable-webgl', '--disable-webgl2', '--disable-gpu'] } } },
  ],
  webServer: {
    // one node process (no npm wrapper) so Playwright can stop it cleanly on Windows; e2e script builds first
    command: `node ../../node_modules/vite/bin/vite.js preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/condoscope/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
