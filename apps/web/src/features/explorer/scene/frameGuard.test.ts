import { describe, expect, it } from 'vitest';
import { nextWait, tooSlow } from './frameGuard';

describe('tooSlow', () => {
  it('is false until three seconds were measured', () => {
    expect(tooSlow([])).toBe(false);
    expect(tooSlow([0, 1])).toBe(false);
  });
  it('is true after three seconds of 3 frames or fewer (a frame every second or slower)', () => {
    expect(tooSlow([1, 0, 1])).toBe(true);
    expect(tooSlow([3, 3, 3])).toBe(true);
  });
  it('is false when one of the last three seconds was fast, or the slow seconds are older', () => {
    expect(tooSlow([1, 1, 20])).toBe(false);
    expect(tooSlow([1, 1, 1, 20, 1, 1])).toBe(false);
    expect(tooSlow([1, 1, 1, 20, 1, 1, 1])).toBe(true);
  });
  it('a normal 30-60 fps scene never trips it', () => {
    expect(tooSlow(Array(30).fill(45))).toBe(false);
  });
});

describe('nextWait', () => {
  it('does not slow down a fast scene', () => {
    expect(nextWait(16)).toBe(0);
    expect(nextWait(100)).toBe(0);
  });
  it('waits as long as the frame took when it took more than 100 ms, at most 2 s', () => {
    expect(nextWait(250)).toBe(250);
    expect(nextWait(1800)).toBe(1800);
    expect(nextWait(9000)).toBe(2000);
  });
});
