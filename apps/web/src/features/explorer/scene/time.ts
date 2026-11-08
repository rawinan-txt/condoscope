import { Color } from 'three';

export type TimeOfDay = 'dusk' | 'day';

/** Shared by every custom shader: 1 = dusk (windows glow), 0 = day. */
export const uNight = { value: 1 };

export const LOOK: Record<TimeOfDay, {
  sky: { top: Color; mid: Color; horizon: Color; glow: Color };
  fog: string; hemi: [string, string, number]; sun: { color: string; intensity: number; position: [number, number, number] };
  env: string; envIntensity: number; bg: string;
}> = {
  dusk: {
    sky: { top: new Color('#16223d'), mid: new Color('#3e5079'), horizon: new Color('#d98e62'), glow: new Color('#ffb070') },
    fog: '#4b4766', hemi: ['#9fb3d9', '#202020', 0.55], sun: { color: '#ffc999', intensity: 1.1, position: [-220, 120, -260] },
    env: 'hdri/dusk.hdr', envIntensity: 0.45, bg: '#16223d',
  },
  day: {
    sky: { top: new Color('#3d7fd6'), mid: new Color('#8fbbe8'), horizon: new Color('#dfeaf3'), glow: new Color('#fff6e0') },
    fog: '#c9d8e6', hemi: ['#ffffff', '#606060', 0.8], sun: { color: '#fff4e5', intensity: 2.4, position: [180, 260, 140] },
    env: 'hdri/day.hdr', envIntensity: 0.9, bg: '#8fbbe8',
  },
};
