import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GLASS } from '../components/glass';
import { compositeOver, contrastRatio } from './contrast';

describe('contrastRatio', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 1); // the well-known "just fails AA" grey
  });
  it('composites a translucent colour over a background', () => {
    expect(compositeOver('#000000', 0.5, '#ffffff')).toBe('#808080');
    expect(compositeOver('#123456', 1, '#ffffff')).toBe('#123456');
  });
});

describe('dark glass panel', () => {
  // the 3D scene behind the panel changes all the time: test the two worst cases, pure black and pure white
  for (const scene of ['#000000', '#ffffff']) {
    const behind = compositeOver(GLASS.bg, GLASS.alpha, scene);
    for (const [name, fg] of Object.entries({ text: GLASS.text, muted: GLASS.muted, link: GLASS.link, placeholder: GLASS.placeholder, field: GLASS.fieldText })) {
      it(`${name} reaches 4.5:1 over a ${scene} scene`, () => {
        const bg = name === 'field' ? GLASS.fieldBg : behind; // form fields sit on their own more opaque background
        expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
      });
    }
    it(`the accent button text stays readable over a ${scene} scene`, () => {
      expect(contrastRatio('#ffffff', GLASS.accentBg)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('index.css uses the same numbers as the tokens (so the tested colours are the shown colours)', () => {
    const css = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8').toLowerCase();
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(GLASS.bg.slice(i, i + 2), 16));
    expect(css).toContain(`rgb(${r} ${g} ${b} / ${GLASS.alpha})`);
    for (const v of [GLASS.text, GLASS.muted, GLASS.link, GLASS.fieldBg, GLASS.fieldText, GLASS.accentBg]) expect(css, v).toContain(v.toLowerCase());
  });
});
