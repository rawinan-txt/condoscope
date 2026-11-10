import type { Project } from '@condoscope/shared';

/** Thailand as a whole: [longitude, latitude] and zoom, used when there is nothing to fit. */
export const THAILAND_VIEW: { center: [number, number]; zoom: number } = { center: [100.99, 15.87], zoom: 5 };

/** [[west, south], [east, north]] around every project with a margin; a single project still gets a small area. null when empty. */
export function boundsOf(projects: Pick<Project, 'latitude' | 'longitude'>[]): [[number, number], [number, number]] | null {
  if (projects.length === 0) return null;
  const lons = projects.map((p) => p.longitude);
  const lats = projects.map((p) => p.latitude);
  const [w, e] = [Math.min(...lons), Math.max(...lons)];
  const [s, n] = [Math.min(...lats), Math.max(...lats)];
  const padLon = Math.max((e - w) * 0.15, 0.06);
  const padLat = Math.max((n - s) * 0.15, 0.06);
  return [[w - padLon, s - padLat], [e + padLon, n + padLat]];
}
