import {
  buildExplorer, buildProjectDetail, buildUnitDetail, searchProjectsLocal,
  type Dataset, type ExplorerPayload, type ProjectDetailPayload, type ProjectPage, type ProjectSearchParams, type UnitDetailPayload,
} from '@condoscope/shared';

export type Source = 'live' | 'fallback';
export interface Result<T> { data: T; source: Source; }
export class NotFoundError extends Error {}

// Task 8 adds the live API (VITE_API_URL). Until then every call is served from the bundled demo dataset.
let dataset: Promise<Dataset> | undefined;
const loadFallback = () => (dataset ??= import('../data/fallback.json').then((m) => m.default as unknown as Dataset));

function requireId(id: number): number {
  if (!Number.isInteger(id) || id <= 0) throw new NotFoundError(`invalid id ${id}`);
  return id;
}

async function fromFallback<T>(what: string, build: (d: Dataset) => T | null): Promise<Result<T>> {
  const data = build(await loadFallback());
  if (data === null) throw new NotFoundError(what);
  return { data, source: 'fallback' };
}

export const searchProjects = (p: ProjectSearchParams = {}): Promise<Result<ProjectPage>> =>
  fromFallback('projects', (d) => searchProjectsLocal(d, p));

export const getProject = (id: number): Promise<Result<ProjectDetailPayload>> =>
  fromFallback(`project ${id}`, (d) => buildProjectDetail(d, requireId(id)));

export const getExplorer = (projectId: number): Promise<Result<ExplorerPayload>> =>
  fromFallback(`project ${projectId}`, (d) => buildExplorer(d, requireId(projectId)));

export const getUnit = (unitId: number): Promise<Result<UnitDetailPayload>> =>
  fromFallback(`unit ${unitId}`, (d) => buildUnitDetail(d, requireId(unitId)));
