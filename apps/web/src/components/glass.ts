/** Dark-glass panel colours. Mirrored in index.css (`.glass`); contrast.test.ts checks they agree and reach 4.5:1. */
export const GLASS = {
  bg: '#0f172a', // slate-900
  alpha: 0.82,
  text: '#f8fafc', // slate-50
  muted: '#cbd5e1', // slate-300
  placeholder: '#cbd5e1',
  link: '#7dd3fc', // sky-300
  fieldBg: '#1e293b', // slate-800
  fieldText: '#f8fafc',
  accentBg: '#2563eb',
} as const;
