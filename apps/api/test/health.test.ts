import type { ApiErrorBody } from '@condoscope/shared';
import { env } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { call } from './helpers';

describe('health and error format', () => {
  it('health ok', async () => {
    const r = await call('/api/health');
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, db: true });
  });

  it('unknown route → 404 in the single error format', async () => {
    const r = await call('/api/nope');
    expect(r.status).toBe(404);
    expect(await r.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  it('an unexpected error does not leak its details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = createApp();
    app.get('/api/_boom', () => { throw new Error('secret detail'); });
    const r = await app.request('/api/_boom', {}, env);
    const text = await r.text();
    expect(r.status).toBe(500);
    expect(text).not.toContain('secret');
    expect((JSON.parse(text) as ApiErrorBody).error.code).toBe('INTERNAL');
  });

  it('DB down → 503 UNAVAILABLE', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const broken = { prepare() { throw new Error('d1 down'); } } as unknown as D1Database;
    const r = await createApp().request('/api/health', {}, { ...env, DB: broken });
    expect(r.status).toBe(503);
    expect(((await r.json()) as ApiErrorBody).error.code).toBe('UNAVAILABLE');
  });
});
