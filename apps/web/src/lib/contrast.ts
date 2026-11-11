// WCAG 2.x contrast helpers (used to test the colours of the translucent panels, which axe cannot judge over a canvas).
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lin = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const luminance = (hex: string) => { const [r, g, b] = rgb(hex).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** `fg` at opacity `alpha` painted over the opaque colour `behind`, as a hex colour. */
export function compositeOver(fg: string, alpha: number, behind: string): string {
  const out = rgb(fg).map((c, i) => Math.round(c * alpha + rgb(behind)[i] * (1 - alpha)));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
