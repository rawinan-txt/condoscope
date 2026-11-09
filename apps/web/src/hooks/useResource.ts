import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';
import { useReportSource } from '../components/Layout';
import { NotFoundError, type Result } from '../services/api';

export type ResourceState<T> =
  | { state: 'loading' }
  | { state: 'ok'; data: T }
  | { state: 'missing' }
  | { state: 'error'; retry(): void };

type Settled<T> = Exclude<ResourceState<T>, { state: 'error' }> | { state: 'error' };

/**
 * Loads something from services/api for a page. Reports where the data came from (so the fallback banner is right),
 * maps NotFoundError to 'missing', and throws away the answer of any request that was replaced or whose page was left:
 * a late answer must never overwrite newer content or flip the banner of another page.
 */
export function useResource<T>(fetcher: () => Promise<Result<T>>, deps: DependencyList): ResourceState<T> {
  const report = useReportSource();
  const [settled, setSettled] = useState<Settled<T>>({ state: 'loading' });
  const latest = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller lists what the fetcher depends on
  const run = useCallback(() => {
    const mine = ++latest.current;
    setSettled({ state: 'loading' });
    fetcher()
      .then((r) => {
        if (mine !== latest.current) return;
        setSettled({ state: 'ok', data: r.data });
        report(r.source);
      })
      .catch((e: unknown) => {
        if (mine !== latest.current) return;
        setSettled({ state: e instanceof NotFoundError ? 'missing' : 'error' });
      });
  }, [report, ...deps]);

  useEffect(() => {
    run();
    return () => { latest.current++; };
  }, [run]);

  return settled.state === 'error' ? { state: 'error', retry: run } : settled;
}
