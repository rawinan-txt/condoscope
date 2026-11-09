// Test-only binding added in vitest.config.ts. Global augmentation (no top-level import) of the Env that `wrangler types` generated.
declare namespace Cloudflare {
  interface Env {
    TEST_MIGRATIONS: import('cloudflare:test').D1Migration[];
  }
}
