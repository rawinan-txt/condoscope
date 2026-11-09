import {
  buildExplorer, buildProjectDetail, buildUnitDetail, searchProjectsLocal,
  type Dataset, type ExplorerPayload, type ProjectDetailPayload, type ProjectPage, type ProjectSearchParams, type UnitDetailPayload,
} from '@condoscope/shared';

export type Source = 'live' | 'fallback';
export interface Result<T> { data: T; source: Source; }
export class NotFoundError extends Error {}

export const API_TIMEOUT_MS = 5000;

// The bundled demo data is only fetched when it is needed: a working API never loads this 600 KB chunk.
let dataset: Promise<Dataset> | undefined;
const loadFallback = () => (dataset ??= import('../data/fallback.json').then((m) => m.default as unknown as Dataset));

// Read at call time (not at import) so tests and previews can change it.
const apiBase = (): string | undefined => import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || undefined;

function requireId(id: number): number {
  if (!Number.isInteger(id) || id <= 0) throw new NotFoundError(`invalid id ${id}`);
  return id;
}

const isApiError = (b: unknown): boolean =>
  typeof b === 'object' && b !== null && typeof (b as { error?: { code?: unknown } }).error?.code === 'string';

async function readJson(res: Response): Promise<unknown> {
  if (!(res.headers.get('content-type') ?? '').includes('json')) return undefined;
  try { return await res.json(); } catch { return undefined; }
}

/**
 * Asks the live API. Returns undefined whenever the answer cannot be trusted (no API configured, network error,
 * timeout, 5xx, a page that is not JSON, broken JSON) so the caller falls back to the bundled data.
 * Throws NotFoundError only for a 400/404 that really is the API's own error format.
 */
async function fetchLive<T>(path: string): Promise<T | undefined> {
  const base = apiBase();
  if (!base) return undefined;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(base + path, { signal: ctrl.signal });
    const body = await readJson(res);
    if ((res.status === 400 || res.status === 404) && isApiError(body)) throw new NotFoundError(path);
    if (!res.ok || typeof body !== 'object' || body === null) return undefined;
    return body as T;
  } catch (e) {
    if (e instanceof NotFoundError) throw e;
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

async function load<T>(path: string, what: string, local: (d: Dataset) => T | null): Promise<Result<T>> {
  const live = await fetchLive<T>(path);
  if (live !== undefined) return { data: live, source: 'live' };
  const data = local(await loadFallback());
  if (data === null) throw new NotFoundError(what);
  return { data, source: 'fallback' };
}

function queryString(p: ProjectSearchParams): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== '') qs.set(k, String(v));
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export const searchProjects = async (p: ProjectSearchParams = {}): Promise<Result<ProjectPage>> =>
  load(`/api/projects${queryString(p)}`, 'projects', (d) => searchProjectsLocal(d, p));

export const getProject = async (id: number): Promise<Result<ProjectDetailPayload>> =>
  load(`/api/projects/${requireId(id)}`, `project ${id}`, (d) => buildProjectDetail(d, id));

export const getExplorer = async (projectId: number): Promise<Result<ExplorerPayload>> =>
  load(`/api/projects/${requireId(projectId)}/explorer`, `project ${projectId}`, (d) => buildExplorer(d, projectId));

export const getUnit = async (unitId: number): Promise<Result<UnitDetailPayload>> =>
  load(`/api/units/${requireId(unitId)}`, `unit ${unitId}`, (d) => buildUnitDetail(d, unitId));
