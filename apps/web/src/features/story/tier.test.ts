import { describe, expect, it } from 'vitest';
import { chooseTier, type TierEnv } from './tier';

const strong: TierEnv = { reducedMotion: false, saveData: false, effectiveType: '4g', hasWebGL: true, cores: 8, memoryGb: 8, coarsePointer: false, width: 1400 };
const t = (o: Partial<TierEnv>) => chooseTier({ ...strong, ...o });

describe('chooseTier', () => {
  it('a strong desktop gets the live 3D', () => expect(t({})).toBe('live'));
  it('reduced motion is static, whatever else is true', () => {
    expect(t({ reducedMotion: true })).toBe('static');
    expect(t({ reducedMotion: true, saveData: true, hasWebGL: false })).toBe('static');
  });
  it('save-data, a slow connection or no WebGL gets the stills', () => {
    expect(t({ saveData: true })).toBe('stills');
    for (const effectiveType of ['slow-2g', '2g', '3g']) expect(t({ effectiveType })).toBe('stills');
    expect(t({ hasWebGL: false })).toBe('stills');
  });
  it('a weak machine gets the stills', () => {
    expect(t({ cores: 4 })).toBe('stills');
    expect(t({ memoryGb: 4 })).toBe('stills');
    expect(t({ memoryGb: 2 })).toBe('stills');
  });
  it('a phone (coarse pointer, narrow) gets the stills, a coarse-pointer wide screen does not', () => {
    expect(t({ coarsePointer: true, width: 390 })).toBe('stills');
    expect(t({ coarsePointer: true, width: 1024 })).toBe('live');
  });
  it('unknown cores, memory and connection type do not count against the device', () => {
    expect(t({ cores: undefined, memoryGb: undefined, effectiveType: undefined })).toBe('live');
  });
});
