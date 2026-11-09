import path from 'node:path';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    cloudflareTest(async () => ({
      wrangler: { configPath: './wrangler.jsonc' },
      miniflare: {
        // test-only binding: setup.ts applies these to the in-memory D1 before each test file
        bindings: { TEST_MIGRATIONS: await readD1Migrations(path.resolve(import.meta.dirname, '../../database/migrations')) },
      },
    })),
  ],
  test: { setupFiles: ['./test/setup.ts'] },
});
