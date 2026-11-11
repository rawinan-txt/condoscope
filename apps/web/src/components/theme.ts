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

/** Dark gradient under text that sits on a photo. The photo may be white, so the weakest alpha is what the contrast test checks. */
export const SCRIM = { top: 0.25, mid: 0.6, bottom: 0.75 } as const;
export const scrimBackground = `linear-gradient(to top, rgb(0 0 0 / ${SCRIM.bottom}), rgb(0 0 0 / ${SCRIM.mid}) 60%, rgb(0 0 0 / ${SCRIM.top}))`;
