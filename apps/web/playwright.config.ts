import { defineConfig } from '@playwright/test';

// Software WebGL so the 3D tests run on machines and CI runners without a GPU.
const SOFT_GL = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://localhost:4173/condoscope/', viewport: { width: 1400, height: 900 } },
  projects: [
    { name: 'chromium', grepInvert: /@nogl/, use: { browserName: 'chromium', launchOptions: { args: SOFT_GL } } },
    { name: 'chromium-nogl', grep: /@nogl/, use: { browserName: 'chromium', launchOptions: { args: ['--disable-webgl', '--disable-webgl2', '--disable-gpu'] } } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/condoscope/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
