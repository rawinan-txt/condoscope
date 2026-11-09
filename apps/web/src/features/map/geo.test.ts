import { generate } from '@condoscope/shared';
import { describe, expect, it } from 'vitest';
import { boundsOf, THAILAND_VIEW } from './geo';

const projects = generate().projects;

describe('boundsOf', () => {
  it('contains every project with some margin', () => {
    const [[w, s], [e, n]] = boundsOf(projects)!;
    for (const p of projects) {
      expect(p.longitude).toBeGreaterThan(w);
      expect(p.longitude).toBeLessThan(e);
      expect(p.latitude).toBeGreaterThan(s);
      expect(p.latitude).toBeLessThan(n);
    }
  });

  it('gives a single project a real area to show, not a point', () => {
    const [[w, s], [e, n]] = boundsOf([projects[0]])!;
    expect(e - w).toBeGreaterThanOrEqual(0.1);
    expect(n - s).toBeGreaterThanOrEqual(0.1);
  });

  it('is null when there is nothing to show', () => {
    expect(boundsOf([])).toBeNull();
  });

  it('the default view is Thailand', () => {
    expect(THAILAND_VIEW.center[0]).toBeGreaterThan(97);
    expect(THAILAND_VIEW.center[0]).toBeLessThan(106);
    expect(THAILAND_VIEW.center[1]).toBeGreaterThan(5);
    expect(THAILAND_VIEW.center[1]).toBeLessThan(21);
  });
});
