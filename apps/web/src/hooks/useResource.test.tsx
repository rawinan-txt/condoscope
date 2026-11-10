import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import Layout from '../components/Layout';
import { NotFoundError, type Result, type Source } from '../services/api';
import { useResource } from './useResource';

const BANNER = 'Demo Fallback Mode';

function Probe({ fetcher, id = 1 }: { fetcher: (id: number) => Promise<Result<string>>; id?: number }) {
  const r = useResource(() => fetcher(id), [id]);
  if (r.state === 'ok') return <p>ok:{r.data}</p>;
  if (r.state === 'error') return <button onClick={r.retry}>retry</button>;
  return <p>{r.state}</p>;
}
const ok = (data: string, source: Source = 'live'): Promise<Result<string>> => Promise.resolve({ data, source });
const inLayout = (ui: React.ReactElement) =>
  render(<MemoryRouter><Routes><Route element={<Layout />}><Route index element={ui} /></Route></Routes></MemoryRouter>);

describe('useResource', () => {
  it('shows loading, then the data; live data leaves the banner hidden', async () => {
    inLayout(<Probe fetcher={() => ok('a')} />);
    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(await screen.findByText('ok:a')).toBeInTheDocument();
    expect(screen.queryByText(BANNER)).toBeNull();
  });

  it('reports fallback data so the banner appears', async () => {
    inLayout(<Probe fetcher={() => ok('a', 'fallback')} />);
    expect(await screen.findByText('ok:a')).toBeInTheDocument();
    expect(screen.getByText(BANNER)).toBeInTheDocument();
  });

  it('NotFoundError means "missing"', async () => {
    inLayout(<Probe fetcher={() => Promise.reject(new NotFoundError('x'))} />);
    expect(await screen.findByText('missing')).toBeInTheDocument();
  });

  it('any other error is "error" and retry asks again', async () => {
    const fetcher = vi.fn<() => Promise<Result<string>>>().mockRejectedValueOnce(new Error('boom')).mockResolvedValue({ data: 'b', source: 'live' });
    inLayout(<Probe fetcher={fetcher} />);
    await userEvent.click(await screen.findByRole('button', { name: 'retry' }));
    expect(await screen.findByText('ok:b')).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('drops the answer of a request that was replaced (deps changed)', async () => {
    let release!: (r: Result<string>) => void;
    const fetcher = (id: number) => (id === 1 ? new Promise<Result<string>>((res) => { release = res; }) : ok('second'));
    function Switch() {
      const nav = useNavigate();
      return <><button onClick={() => nav('/two')}>go</button><Routes><Route path="/" element={<Probe fetcher={fetcher} id={1} />} /><Route path="/two" element={<Probe fetcher={fetcher} id={2} />} /></Routes></>;
    }
    render(<MemoryRouter><Switch /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'go' }));
    expect(await screen.findByText('ok:second')).toBeInTheDocument();
    release({ data: 'first', source: 'live' });
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.getByText('ok:second')).toBeInTheDocument();
    expect(screen.queryByText('ok:first')).toBeNull();
  });
});
