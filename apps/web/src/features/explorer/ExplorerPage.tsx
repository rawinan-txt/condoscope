import type { ExplorerPayload } from '@condoscope/shared';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useReportSource } from '../../components/Layout';
import NotFound, { LoadError } from '../../components/NotFound';
import { getExplorer, NotFoundError } from '../../services/api';
import Filters from './Filters';
import FloorSelector from './FloorSelector';
import Legend from './Legend';
import UnitList from './UnitList';
import UnitPanel from './UnitPanel';
import { useExplorer } from './useExplorer';

type Load = { state: 'loading' } | { state: 'ok'; data: ExplorerPayload } | { state: 'missing' } | { state: 'error' };

export default function ExplorerPage() {
  const { projectId } = useParams();
  const report = useReportSource();
  const [load, setLoad] = useState<Load>({ state: 'loading' });

  const fetchData = useCallback(() => {
    setLoad({ state: 'loading' });
    getExplorer(Number(projectId))
      .then((r) => { setLoad({ state: 'ok', data: r.data }); report(r.source); })
      .catch((e) => setLoad({ state: e instanceof NotFoundError ? 'missing' : 'error' }));
  }, [projectId, report]);
  useEffect(fetchData, [fetchData]);

  if (load.state === 'loading') return <div className="mx-auto max-w-7xl animate-pulse px-4 py-8"><div className="h-[60vh] rounded-lg bg-slate-100" /></div>;
  if (load.state === 'missing') return <NotFound message="ไม่พบโครงการนี้" />;
  if (load.state === 'error') return <LoadError onRetry={fetchData} />;
  return <Explorer key={load.data.project.id} payload={load.data} />;
}

function Explorer({ payload }: { payload: ExplorerPayload }) {
  const x = useExplorer(payload);
  const [params] = useSearchParams();
  const preselect = Number(params.get('unit'));
  const { select } = x;
  useEffect(() => {
    if (payload.units.some((u) => u.id === preselect)) select(preselect);
  }, [payload.units, preselect, select]);

  return (
    <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 md:grid-cols-[1fr_360px]">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-xl font-semibold">{payload.project.name}</h1>
          <p className="text-sm text-slate-600">{payload.project.neighborhood} · {payload.project.province}</p>
        </div>
        <div className="flex h-[60vh] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
          {/* Building view: SVG (Task 6) and 3D (Task 7) */}
          ภาพตึก
        </div>
        <div className="mt-3"><Legend /></div>
      </div>
      <aside className="space-y-4">
        <UnitPanel x={x} />
        <Filters x={x} />
        <FloorSelector x={x} />
        <UnitList x={x} />
      </aside>
    </div>
  );
}
