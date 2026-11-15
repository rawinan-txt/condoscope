import { describe, expect, it } from 'vitest';
import { clamp01, easeInOut, remap, sectionProgress } from './scroll';

describe('remap', () => {
  it('is 0 before, 1 after and linear between', () => {
    expect(remap(0.5, 0.25, 0.75)).toBe(0.5);
    expect(remap(-1, 0, 1)).toBe(0);
    expect(remap(2, 0, 1)).toBe(1);
  });
  it('is a step (never NaN) when the range is empty', () => {
    expect(remap(0.3, 0.5, 0.5)).toBe(0);
    expect(remap(0.5, 0.5, 0.5)).toBe(1);
  });
});

describe('easeInOut', () => {
  it('has fixed ends and midpoint and never goes down', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
    let last = 0;
    for (let t = 0; t <= 1; t += 0.01) { expect(easeInOut(t)).toBeGreaterThanOrEqual(last); last = easeInOut(t); }
  });
});

describe('sectionProgress', () => {
  it('is 0 at the top, 0.5 halfway, 1 past the end', () => {
    expect(sectionProgress({ top: 0, height: 1000 }, 500)).toBe(0);
    expect(sectionProgress({ top: -250, height: 1000 }, 500)).toBe(0.5);
    expect(sectionProgress({ top: -9999, height: 1000 }, 500)).toBe(1);
    expect(sectionProgress({ top: 300, height: 1000 }, 500)).toBe(0);
  });
  it('is 0 for a section no taller than the screen', () => {
    expect(sectionProgress({ top: 0, height: 300 }, 500)).toBe(0);
    expect(sectionProgress({ top: -50, height: 500 }, 500)).toBe(0);
  });
});

it('clamp01 clamps and survives NaN', () => {
  expect([clamp01(-1), clamp01(2), clamp01(0.3), clamp01(NaN)]).toEqual([0, 1, 0.3, 0]);
});
