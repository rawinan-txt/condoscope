import { buildExplorer, buildUnitDetail, generate, searchProjectsLocal } from '@condoscope/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_TIMEOUT_MS, getExplorer, getProject, getUnit, NotFoundError, searchProjects } from './api';

const d = generate();
const json = (body: unknown, status = 200, type = 'application/json') =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': type } });
const stubFetch = (impl: (url: string, init?: RequestInit) => Promise<Response>) => {
  const f = vi.fn(impl);
  vi.stubGlobal('fetch', f);
  return f;
};

beforeEach(() => { vi.stubEnv('VITE_API_URL', 'https://api.test/'); });
afterEach(() => { vi.useRealTimers(); });

describe('live API answers', () => {
  it('is used when it works: source live, URL without a doubled slash', async () => {
    const f = stubFetch(async () => json(buildExplorer(d, 1)));
    const r = await getExplorer(1);
    expect(r.source).toBe('live');
    expect(r.data).toEqual(buildExplorer(d, 1));
    expect(f.mock.calls[0][0]).toBe('https://api.test/api/projects/1/explorer');
  });

  it('covers every call', async () => {
    const f = stubFetch(async () => json({ ok: true }));
    await getUnit(7); await getProject(2);
    expect(f.mock.calls.map((c) => c[0])).toEqual(['https://api.test/api/units/7', 'https://api.test/api/projects/2']);
  });

  it('searchProjects drops undefined values and encodes Thai text', async () => {
    const f = stubFetch(async () => json(searchProjectsLocal(d, {})));
    await searchProjects({ q: 'อารีย์', maxPrice: 5_000_000, province: undefined });
    expect(f.mock.calls[0][0]).toBe('https://api.test/api/projects?q=%E0%B8%AD%E0%B8%B2%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B9%8C&maxPrice=5000000');
    await searchProjects();
    expect(f.mock.calls[1][0]).toBe('https://api.test/api/projects');
  });
});

describe('falls back, and says so, when the API cannot be trusted', () => {
  const FAILURES: [string, () => Promise<Response>][] = [
    ['network error', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['HTTP 500', async () => json({ error: { code: 'INTERNAL', message: 'x' } }, 500)],
    ['HTTP 503', async () => json({ error: { code: 'UNAVAILABLE', message: 'x' } }, 503)],
    ['200 with an HTML page', async () => json('<!doctype html><title>x</title>', 200, 'text/html')],
    ['200 with broken JSON', async () => json('{"project":', 200)],
    ['200 with JSON null', async () => json('null')],
    ['404 HTML page (wrong API address)', async () => json('<h1>404</h1>', 404, 'text/html')],
    ['404 JSON that is not the API error format', async () => json({ message: 'nope' }, 404)],
  ];
  it.each(FAILURES)('%s', async (_name, respond) => {
    stubFetch(respond);
    const r = await getExplorer(1);
    expect(r.source).toBe('fallback');
    expect(r.data.units).toHaveLength(624);
  });

  it('gives up after API_TIMEOUT_MS when the API never answers', async () => {
    vi.useFakeTimers();
    stubFetch((_url, init) => new Promise((_res, rej) => init!.signal!.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))));
    const pending = getUnit(1);
    await vi.advanceTimersByTimeAsync(API_TIMEOUT_MS);
    const r = await pending;
    expect(r.source).toBe('fallback');
    expect(r.data).toEqual(buildUnitDetail(d, 1));
  });
});

describe('a missing item is "not found", not a fallback', () => {
  it.each([[404, 'NOT_FOUND'], [400, 'VALIDATION_ERROR']])('API error %i %s', async (status, code) => {
    stubFetch(async () => json({ error: { code, message: 'x' } }, status));
    await expect(getUnit(999999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('an invalid id never reaches the network', async () => {
    const f = stubFetch(async () => json({}));
    await expect(getUnit(Number.NaN)).rejects.toBeInstanceOf(NotFoundError);
    expect(f).not.toHaveBeenCalled();
  });
});

describe('without VITE_API_URL', () => {
  it('uses the bundled data and does not call fetch', async () => {
    vi.stubEnv('VITE_API_URL', '');
    const f = stubFetch(async () => json({}));
    const r = await getExplorer(1);
    expect(r.source).toBe('fallback');
    expect(f).not.toHaveBeenCalled();
  });
});
