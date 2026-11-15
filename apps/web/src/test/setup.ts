import type {} from '@testing-library/jest-dom/vitest'; // types only
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, beforeEach, expect, vi } from 'vitest';
import { INTRO_KEY, resetIntro } from '../lib/intro';

// extend this file's own expect: the packaged '@testing-library/jest-dom/vitest' ended up extending a different vitest copy
expect.extend(matchers);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  try { localStorage.clear(); } catch { /* storage blocked in a test */ }
});

// every test starts as a returning visitor (no intro); the intro tests clear this themselves
beforeEach(() => { resetIntro(); try { localStorage.setItem(INTRO_KEY, 'seen'); } catch { /* blocked */ } });

// jsdom does not implement scrolling; the intro scrolls to the top when it ends
if (typeof window !== 'undefined') window.scrollTo = () => {};

// the fallback dataset import can take >1s on a busy machine
configure({ asyncUtilTimeout: 5000 });
