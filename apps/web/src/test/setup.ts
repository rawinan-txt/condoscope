import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  try { localStorage.clear(); } catch { /* storage blocked in a test */ }
});

// the fallback dataset import can take >1s on a busy machine
configure({ asyncUtilTimeout: 5000 });
