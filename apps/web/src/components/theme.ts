/** Site colour tokens. Mirrored in the @theme block of index.css; theme.test.ts checks that and the contrast of every pair in PAIRS. */
export const THEME = {
  ink: '#14120f',
  ivory: '#f6f2ea',
  stone: '#5c554b',
  bronze: '#7a5a22',
  champagne: '#c8a96b',
  champagneSoft: '#e2cc9a',
  inkMuted: '#bdb5a6',
  accentHover: '#2b2620',
} as const;

/** Text colour pairs the site really uses. Champagne is never text on ivory (2.0:1): only lines and button fills. */
export const PAIRS: { name: string; fg: string; bg: string; min: number }[] = [
  { name: 'ink on ivory', fg: THEME.ink, bg: THEME.ivory, min: 4.5 },
  { name: 'stone on ivory', fg: THEME.stone, bg: THEME.ivory, min: 4.5 },
  { name: 'bronze on ivory', fg: THEME.bronze, bg: THEME.ivory, min: 4.5 },
  { name: 'bronze on white', fg: THEME.bronze, bg: '#ffffff', min: 4.5 },
  { name: 'ivory on ink', fg: THEME.ivory, bg: THEME.ink, min: 4.5 },
  { name: 'ivory on hover ink', fg: THEME.ivory, bg: THEME.accentHover, min: 4.5 },
  { name: 'muted on ink', fg: THEME.inkMuted, bg: THEME.ink, min: 4.5 },
  { name: 'champagne on ink', fg: THEME.champagne, bg: THEME.ink, min: 4.5 },
  { name: 'soft champagne on ink', fg: THEME.champagneSoft, bg: THEME.ink, min: 4.5 },
  { name: 'ink on champagne (button)', fg: THEME.ink, bg: THEME.champagne, min: 4.5 },
];
