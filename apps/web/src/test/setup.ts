import type {} from '@testing-library/jest-dom/vitest'; // types only
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, expect, vi } from 'vitest';

// extend this file's own expect: the packaged '@testing-library/jest-dom/vitest' ended up extending a different vitest copy
expect.extend(matchers);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  try { localStorage.clear(); } catch { /* storage blocked in a test */ }
});

// the fallback dataset import can take >1s on a busy machine
configure({ asyncUtilTimeout: 5000 });
