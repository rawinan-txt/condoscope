import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compositeOver, contrastRatio } from '../lib/contrast';
import { PAIRS, SCRIM, THEME } from './theme';

describe('site theme', () => {
  for (const p of PAIRS) it(`${p.name} reaches ${p.min}:1`, () => expect(contrastRatio(p.fg, p.bg)).toBeGreaterThanOrEqual(p.min));

  it('champagne must not be used as text on ivory', () => {
    expect(contrastRatio(THEME.champagne, THEME.ivory)).toBeLessThan(3);
  });

  it('index.css @theme uses the same colours as the tokens', () => {
    const css = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8').toLowerCase();
    const vars: Record<string, string> = {
      '--color-ink': THEME.ink, '--color-ivory': THEME.ivory, '--color-stone': THEME.stone, '--color-bronze': THEME.bronze,
      '--color-champagne': THEME.champagne, '--color-champagne-soft': THEME.champagneSoft, '--color-ink-muted': THEME.inkMuted,
      '--color-accent': THEME.ink, '--color-accent-hover': THEME.accentHover,
    };
    for (const [k, v] of Object.entries(vars)) expect(css, k).toContain(`${k}: ${v};`);
  });

  it('the serif font has a system fallback that covers Thai', () => {
    const css = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');
    expect(css).toMatch(/--font-serif:\s*'Noto Serif Thai',[^;]*serif;/);
  });

  it('white text over the scrim is readable even on a pure white photo', () => {
    expect(contrastRatio('#ffffff', compositeOver('#000000', SCRIM.mid, '#ffffff'))).toBeGreaterThanOrEqual(4.5);
  });
});
