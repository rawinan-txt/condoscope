import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { completeIntro, hasSeenIntro, INTRO_KEY, resetIntro } from './intro';

beforeEach(() => { resetIntro(); localStorage.removeItem(INTRO_KEY); }); // the shared setup makes every test a returning visitor
afterEach(() => resetIntro());

describe('the first-visit intro memory', () => {
  it('is unseen at first, seen after completing, and remembered in localStorage', () => {
    expect(hasSeenIntro()).toBe(false);
    completeIntro();
    expect(hasSeenIntro()).toBe(true);
    expect(localStorage.getItem(INTRO_KEY)).toBe('seen');
  });

  it('a stored mark from an earlier visit counts', () => {
    localStorage.setItem(INTRO_KEY, 'seen');
    expect(hasSeenIntro()).toBe(true);
  });

  it('with unusable storage nothing throws and the intro still stays away for the visit', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(hasSeenIntro()).toBe(false);
    expect(() => completeIntro()).not.toThrow();
    expect(hasSeenIntro()).toBe(true);
  });
});
