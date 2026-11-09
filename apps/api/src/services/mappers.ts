import type { Building, Project } from '@condoscope/shared';

// Light on purpose: Workers Free allows 10 ms CPU per request, so rows are converted, not re-validated.
type ProjectRow = Omit<Project, 'is_featured'> & { is_featured: number };
type BuildingRow = Omit<Building, 'unit_bay_widths' | 'has_explorer'> & { unit_bay_widths: string; has_explorer: number };

export const projectFromRow = (r: ProjectRow): Project => ({ ...r, is_featured: r.is_featured === 1 });

export const buildingFromRow = (r: BuildingRow): Building => ({
  ...r,
  unit_bay_widths: JSON.parse(r.unit_bay_widths) as number[],
  has_explorer: r.has_explorer === 1,
});
