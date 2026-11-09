import { buildExplorer, buildUnitDetail, generate } from '@condoscope/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';

const d = generate();
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
const GoTo = ({ to }: { to: string }) => { const nav = useNavigate(); return <button onClick={() => nav(to)}>go</button>; };

/**
 * The API is slow for the first page. The user moves on, the second page loads live, and only then does the first
 * request fail and fall back. Its late answer must not replace the page the user is looking at, nor flip the banner.
 */
describe('a late answer from a page the user already left', () => {
  const CASES = [
    { name: 'unit page', from: '/unit/1', slow: '/api/units/1', to: '/unit/2', fast: () => buildUnitDetail(d, 2), heading: /^ห้อง A-702$/ },
    { name: 'explorer page', from: '/explorer/1', slow: '/api/projects/1/explorer', to: '/explorer/2', fast: () => buildExplorer(d, 2), heading: /^Selvara On Nut$/ },
    { name: 'home page', from: '/', slow: '/api/projects', to: '/explorer/2', fast: () => buildExplorer(d, 2), heading: /^Selvara On Nut$/ },
  ];

  it.each(CASES)('$name', async ({ from, slow, to, fast, heading }) => {
    vi.stubEnv('VITE_API_URL', 'https://api.test');
    let failSlow!: () => void;
    vi.stubGlobal('fetch', vi.fn((url: string) =>
      url.endsWith(slow)
        ? new Promise<Response>((res) => { failSlow = () => res(new Response('boom', { status: 500 })); })
        : Promise.resolve(ok(fast()))));
    await import('../data/fallback.json'); // already loaded, so the late fallback resolves the moment the slow request fails

    render(<MemoryRouter initialEntries={[from]}><App /><GoTo to={to} /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'go' }));
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();

    failSlow();
    await new Promise((r) => setTimeout(r, 50));

    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.queryByText('Demo Fallback Mode')).toBeNull();
  });
});
