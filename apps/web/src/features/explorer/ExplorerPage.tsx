import type { ExplorerPayload } from '@condoscope/shared';
import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router';
import NotFound, { LoadError } from '../../components/NotFound';
import { useResource } from '../../hooks/useResource';
import { getExplorer } from '../../services/api';
import BuildingView from './BuildingView';
import Filters from './Filters';
import FloorSelector from './FloorSelector';
import Legend from './Legend';
import UnitList from './UnitList';
import UnitPanel from './UnitPanel';
import { useExplorer } from './useExplorer';

export default function ExplorerPage() {
  const { projectId } = useParams();
  const r = useResource(() => getExplorer(Number(projectId)), [projectId]);

  if (r.state === 'loading') return <div className="mx-auto max-w-7xl animate-pulse px-4 py-8"><div className="h-[60vh] rounded-lg bg-slate-100" /></div>;
  if (r.state === 'missing') return <NotFound message="ไม่พบโครงการนี้" />;
  if (r.state === 'error') return <LoadError onRetry={r.retry} />;
  return <Explorer key={r.data.project.id} payload={r.data} />;
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
        <div className="h-[60vh] rounded-lg border border-slate-200 bg-slate-50">
          <BuildingView x={x} />
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
