/** Dark-glass panel colours. Mirrored in index.css (`.glass`); contrast.test.ts checks they agree and reach 4.5:1. Same palette as the rest of the site (components/theme.ts). */
export const GLASS = {
  bg: '#14120f', // ink
  alpha: 0.82,
  text: '#f6f2ea', // ivory
  muted: '#bdb5a6',
  placeholder: '#bdb5a6',
  link: '#e2cc9a', // soft champagne
  fieldBg: '#2b2620',
  fieldText: '#f6f2ea',
  accentBg: '#c8a96b', // champagne
  accentText: '#14120f', // ink on champagne
} as const;
