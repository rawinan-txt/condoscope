import { sanitizeSearchParams, toQueryRecord, type ProjectSearchParams, type ProjectSort } from '@condoscope/shared';
import { Map, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { LoadError } from '../../components/NotFound';
import ProjectCard from '../../components/ProjectCard';
import { useResource } from '../../hooks/useResource';
import { searchProjects } from '../../services/api';
import FiltersPanel from './FiltersPanel';
import { FIELD_CLASS } from './options';

const SORTS: [ProjectSort, string][] = [['recommended', 'แนะนำ'], ['price_asc', 'ราคาต่ำ → สูง'], ['price_desc', 'ราคาสูง → ต่ำ'], ['newest', 'ใหม่สุด']];
const NOT_FILTERS = ['sort', 'limit', 'offset'];

// shortcut: no page buttons (5 projects, default limit 20); add them when there are more than 20 projects
export default function SearchPage() {
  const [sp, setSp] = useSearchParams();
  const params = useMemo(() => sanitizeSearchParams(Object.fromEntries(sp)), [sp]);
  const r = useResource(() => searchProjects(params), [JSON.stringify(params)]);
  const [open, setOpen] = useState(false);

  const filterKeys = Object.keys(params).filter((k) => !NOT_FILTERS.includes(k));
  const apply = (p: ProjectSearchParams) => setSp(toQueryRecord(p), { replace: true });
  const clear = () => setSp({}, { replace: true });
  const mapSearch = new URLSearchParams(toQueryRecord(Object.fromEntries(Object.entries(params).filter(([k]) => !NOT_FILTERS.includes(k))))).toString();

  if (r.state === 'error' || r.state === 'missing') return <LoadError onRetry={r.state === 'error' ? r.retry : () => location.reload()} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-semibold">ค้นหาคอนโด</h1>
      <div className="mt-4 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="filters"
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm lg:hidden"
          >
            <SlidersHorizontal className="size-4" aria-hidden />ตัวกรอง ({filterKeys.length})
          </button>
          <div id="filters" className={`mt-3 lg:mt-0 ${open ? 'block' : 'hidden lg:block'}`}>
            <FiltersPanel value={params} onChange={apply} />
            {filterKeys.length > 0 && (
              <button type="button" onClick={clear} className="mt-3 text-sm text-accent hover:underline">ล้างตัวกรอง</button>
            )}
          </div>
        </aside>

        <section aria-label="ผลการค้นหา">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" className="text-sm text-slate-700">{r.state === 'ok' ? <>พบ {r.data.total} โครงการ</> : 'กำลังค้นหา…'}</p>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">เรียงตาม
                <select value={params.sort ?? 'recommended'} onChange={(e) => apply({ ...params, sort: e.target.value as ProjectSort })} className={`${FIELD_CLASS} mt-0 w-auto`}>
                  {SORTS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </select>
              </label>
              <Link to={{ pathname: '/map', search: mapSearch ? `?${mapSearch}` : '' }} className="inline-flex items-center gap-2 rounded-md border border-accent px-3 py-2 text-sm text-accent hover:bg-blue-50">
                <Map className="size-4" aria-hidden />ดูบนแผนที่
              </Link>
            </div>
          </div>

          {r.state === 'loading' && <div className="mt-4 h-64 animate-pulse rounded-lg bg-slate-100" />}
          {r.state === 'ok' && r.data.items.length === 0 && (
            <div className="mt-8 rounded-lg border border-dashed border-slate-300 p-8 text-center">
              <p className="text-slate-700">ไม่พบโครงการที่ตรงเงื่อนไข</p>
              <button type="button" onClick={clear} className="mt-3 rounded-md bg-accent px-4 py-2 text-white hover:bg-accent-hover">ล้างตัวกรอง</button>
            </div>
          )}
          {r.state === 'ok' && r.data.items.length > 0 && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{r.data.items.map((p) => <ProjectCard key={p.id} project={p} />)}</div>
          )}
        </section>
      </div>
    </div>
  );
}
