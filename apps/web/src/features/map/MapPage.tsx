import { formatMillion, sanitizeSearchParams, toQueryRecord, type ProjectSearchParams } from '@condoscope/shared';
import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { LoadError } from '../../components/NotFound';
import { useResource } from '../../hooks/useResource';
import { searchProjects } from '../../services/api';
import FiltersPanel from '../search/FiltersPanel';

const MapView = lazy(() => import('./MapView')); // keeps maplibre out of every other page

const toggle = (on: boolean) => `flex-1 rounded-md px-3 py-2 text-sm ${on ? 'bg-accent text-white' : 'border border-slate-300 bg-white'}`;

export default function MapPage() {
  const [sp, setSp] = useSearchParams();
  const params = useMemo(() => sanitizeSearchParams(Object.fromEntries(sp)), [sp]);
  const query = useMemo<ProjectSearchParams>(() => ({ ...params, sort: undefined, offset: undefined, limit: 50 }), [params]);
  const r = useResource(() => searchProjects(query), [JSON.stringify(query)]);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [unavailable, setUnavailable] = useState(false);
  const failed = useCallback(() => setUnavailable(true), []);
  const apply = (p: ProjectSearchParams) => setSp(toQueryRecord(p), { replace: true });

  if (r.state === 'error' || r.state === 'missing') return <LoadError onRetry={r.state === 'error' ? r.retry : () => location.reload()} />;
  const projects = r.state === 'ok' ? r.data.items : [];
  const showList = view === 'list' || unavailable;
  const showMap = view === 'map' || unavailable;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-semibold">แผนที่โครงการ</h1>
      <div className="mt-3 flex gap-2 lg:hidden" role="group" aria-label="มุมมอง">
        <button type="button" aria-pressed={view === 'map'} className={toggle(view === 'map')} onClick={() => setView('map')}>แผนที่</button>
        <button type="button" aria-pressed={view === 'list'} className={toggle(view === 'list')} onClick={() => setView('list')}>รายการ</button>
      </div>
      <div className="mt-4 grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className={`${showList ? 'block' : 'hidden'} space-y-4 lg:block`}>
          <FiltersPanel value={params} onChange={apply} />
          <p aria-live="polite" className="text-sm text-slate-700">{r.state === 'ok' ? <>พบ {r.data.total} โครงการ</> : 'กำลังโหลด…'}</p>
          {r.state === 'ok' && projects.length === 0 && <p className="text-sm text-slate-600">ไม่พบโครงการที่ตรงเงื่อนไข</p>}
          <ul aria-label="รายการโครงการ" className="divide-y divide-slate-200 rounded-lg border border-slate-200">
            {projects.map((p) => (
              <li key={p.id} className="p-3">
                <Link to={`/project/${p.id}`} className="font-medium text-accent hover:underline">{p.name}</Link>
                <p className="text-sm text-slate-600">{p.neighborhood} · {p.province}</p>
                <p className="text-sm">เริ่มต้น {formatMillion(p.starting_price)}</p>
              </li>
            ))}
          </ul>
        </aside>
        <div className={`${showMap ? 'block' : 'hidden'} lg:block`}>
          {unavailable ? (
            <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">แผนที่โหลดไม่ได้ กำลังแสดงเป็นรายการแทน</p>
          ) : (
            <Suspense fallback={<div className="h-[60vh] animate-pulse rounded-lg bg-slate-100" />}>
              {r.state === 'ok' && <MapView projects={projects} onUnavailable={failed} />}
            </Suspense>
          )}
          <p className="mt-2 text-xs text-slate-500">
            แผนที่: <a className="underline" href="https://openfreemap.org">OpenFreeMap</a> © <a className="underline" href="https://www.openmaptiles.org/">OpenMapTiles</a>{' '}
            ข้อมูลจาก <a className="underline" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>
          </p>
        </div>
      </div>
    </div>
  );
}
