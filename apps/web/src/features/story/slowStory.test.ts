import { describe, expect, it } from 'vitest';
import { FRAME_SAMPLES, storyTooSlow } from './slowStory';

describe('storyTooSlow', () => {
  it('waits for enough frames before judging', () => {
    expect(storyTooSlow(Array(FRAME_SAMPLES - 1).fill(200))).toBe(false);
    expect(storyTooSlow([])).toBe(false);
  });
  it('a slow average (over 28 ms) is too slow, a fast one is not', () => {
    expect(storyTooSlow(Array(FRAME_SAMPLES).fill(40))).toBe(true);
    expect(storyTooSlow(Array(FRAME_SAMPLES).fill(16))).toBe(false);
    expect(storyTooSlow(Array(FRAME_SAMPLES).fill(28))).toBe(false);
  });
  it('one long hitch among fast frames does not trip it (the average does)', () => {
    expect(storyTooSlow([...Array(FRAME_SAMPLES - 1).fill(16), 200])).toBe(false);
  });
});
