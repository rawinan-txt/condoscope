import { generate, type ApiErrorBody } from '@condoscope/shared';
import { env } from 'cloudflare:workers';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { isAllowedOrigin, parseAllowedOrigins } from '../src/middleware/cors';
import { call, seedDb } from './helpers';

beforeAll(() => seedDb(env.DB));
const acao = (r: Response) => r.headers.get('access-control-allow-origin');
const withOrigin = (origin: string) => ({ headers: { Origin: origin } });

describe('CORS allow-list', () => {
  it.each(['https://rawinan-txt.github.io', 'http://localhost:5173', 'http://127.0.0.1:4321', 'http://localhost'])('allows %s', async (origin) => {
    const r = await call('/api/projects/1', withOrigin(origin));
    expect(r.status).toBe(200);
    expect(acao(r)).toBe(origin);
    expect(r.headers.get('vary')).toContain('Origin');
  });

  it.each(['https://rawinan-txt.github.io.evil.com', 'https://evil.com', 'http://localhost.evil.com', 'https://localhost:5173', 'http://localhost:99999999', 'null', ''])(
    'does not allow %j', async (origin) => {
      const r = await call('/api/projects/1', withOrigin(origin));
      expect(acao(r)).toBeNull();
    });

  it('answers a preflight from an allowed origin', async () => {
    const r = await call('/api/projects', { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'GET' } });
    expect(r.status).toBe(204);
    expect(acao(r)).toBe('http://localhost:5173');
    expect(r.headers.get('access-control-allow-methods')).toContain('GET');
    expect(r.headers.get('access-control-allow-methods')).not.toContain('POST');
  });

  it('a preflight from a stranger gets no permission', async () => {
    const r = await call('/api/projects', { method: 'OPTIONS', headers: { Origin: 'https://evil.com', 'Access-Control-Request-Method': 'GET' } });
    expect(acao(r)).toBeNull();
  });

  it('a request without Origin (curl) works normally', async () => {
    const r = await call('/api/projects/1');
    expect(r.status).toBe(200);
    expect(acao(r)).toBeNull();
  });

  it('ALLOWED_ORIGINS adds an origin without a code change', async () => {
    const r = await createApp().request('/api/health', withOrigin('https://example.dev'), { ...env, ALLOWED_ORIGINS: 'https://example.dev' });
    expect(acao(r)).toBe('https://example.dev');
    const other = await createApp().request('/api/health', withOrigin('https://rawinan-txt.github.io'), { ...env, ALLOWED_ORIGINS: 'https://example.dev' });
    expect(acao(other)).toBeNull(); // the configured list replaces the default
  });

  it('parseAllowedOrigins / isAllowedOrigin', () => {
    expect(parseAllowedOrigins(' https://a.dev , ,https://b.dev ')).toEqual(['https://a.dev', 'https://b.dev']);
    expect(parseAllowedOrigins(undefined)).toEqual([]);
    expect(isAllowedOrigin('https://a.dev', ['https://a.dev'])).toBe(true);
    expect(isAllowedOrigin('https://a.dev.evil.com', ['https://a.dev'])).toBe(false);
    expect(isAllowedOrigin('http://localhost:5173/', [])).toBe(false);
  });
});

describe('Cache-Control', () => {
  it('public data is cacheable', async () => {
    for (const path of ['/api/projects', '/api/projects/1', '/api/projects/1/explorer', '/api/units/1']) {
      expect((await call(path)).headers.get('cache-control'), path).toBe('public, max-age=300, s-maxage=3600');
    }
  });

  it('health and every error are never cached', async () => {
    for (const path of ['/api/health', '/api/units/999999', '/api/units/abc', '/api/nope']) {
      expect((await call(path)).headers.get('cache-control'), path).toBe('no-store');
    }
  });
});

describe('write methods are closed', () => {
  const count = async (t: string) => (await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${t}`).first<{ n: number }>())!.n;

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('%s → 405 and nothing changes', async (method) => {
    const before = [await count('units'), await count('projects')];
    for (const path of ['/api/projects', '/api/units/1', '/api/health']) {
      const r = await call(path, { method, body: method === 'DELETE' ? undefined : '{}' });
      expect(r.status, `${method} ${path}`).toBe(405);
      expect(r.headers.get('allow')).toBe('GET, HEAD, OPTIONS');
      expect(((await r.json()) as ApiErrorBody).error.code).toBe('METHOD_NOT_ALLOWED');
    }
    expect([await count('units'), await count('projects')]).toEqual(before);
  });

  it('HEAD still works', async () => {
    const r = await call('/api/projects/1', { method: 'HEAD' });
    expect(r.status).toBe(200);
    expect(await r.text()).toBe('');
  });
});

describe('X-Content-Type-Options', () => {
  it.each(['/api/projects/1', '/api/units/999999', '/api/units/abc', '/api/nope'])('is nosniff on %s', async (path) => {
    expect((await call(path)).headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('is nosniff on a 405 too', async () => {
    expect((await call('/api/projects', { method: 'POST' })).headers.get('x-content-type-options')).toBe('nosniff');
  });
});
