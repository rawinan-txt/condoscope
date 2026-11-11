import type { ExplorerPayload } from '@condoscope/shared';
import { ArrowLeft, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import NotFound, { LoadError } from '../../components/NotFound';
import OverlayPanel from '../../components/OverlayPanel';
import { useResource } from '../../hooks/useResource';
import { getExplorer } from '../../services/api';
import BuildingView from './BuildingView';
import ExplorerTabs from './ExplorerTabs';
import Legend from './Legend';
import UnitPanel from './UnitPanel';
import { useExplorer } from './useExplorer';

const PANEL_KEY = 'condoscope.explorer.panel';
const loadPanelOpen = () => { try { return sessionStorage.getItem(PANEL_KEY) !== '0'; } catch { return true; } };
const savePanelOpen = (open: boolean) => { try { sessionStorage.setItem(PANEL_KEY, open ? '1' : '0'); } catch { /* storage blocked: the choice just is not remembered */ } };

export default function ExplorerPage() {
  const { projectId } = useParams();
  const r = useResource(() => getExplorer(Number(projectId)), [projectId]);

  if (r.state === 'loading') return <div className="h-full animate-pulse bg-slate-100" />;
  if (r.state === 'missing') return <NotFound message="ไม่พบโครงการนี้" />;
  if (r.state === 'error') return <LoadError onRetry={r.retry} />;
  return <Explorer key={r.data.project.id} payload={r.data} />;
}

function Explorer({ payload }: { payload: ExplorerPayload }) {
  const x = useExplorer(payload);
  const [params] = useSearchParams();
  const [panelOpen, setPanelOpen] = useState(loadPanelOpen);
  const preselect = Number(params.get('unit'));
  const { select } = x;
  useEffect(() => {
    if (payload.units.some((u) => u.id === preselect)) select(preselect);
  }, [payload.units, preselect, select]);

  const togglePanel = () => setPanelOpen((open) => { savePanelOpen(!open); return !open; });
  const { project } = payload;

  const header = (
    <OverlayPanel title="โครงการ" className="p-3">
      <Link to={`/project/${project.id}`} className="inline-flex items-center gap-1 text-sm underline-offset-2 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> กลับหน้าโครงการ
      </Link>
      <h1 className="mt-1 text-lg font-semibold leading-tight">{project.name}</h1>
      <p className="glass-muted text-sm">{project.neighborhood} · {project.province}</p>
    </OverlayPanel>
  );
  const footer = <OverlayPanel title="สถานะห้อง" className="p-3"><Legend /></OverlayPanel>;

  return (
    <div className="relative h-full">
      <BuildingView x={x} header={header} footer={footer} />
      <div className="pointer-events-none absolute inset-y-3 right-3 flex w-[min(22.5rem,calc(100%-1.5rem))] flex-col items-end gap-3 overflow-y-auto md:inset-y-4 md:right-4">
        <button
          type="button"
          aria-expanded={panelOpen}
          aria-controls="explorer-panels"
          onClick={togglePanel}
          className="glass pointer-events-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm"
        >
          {panelOpen ? <PanelRightClose className="size-4" aria-hidden /> : <PanelRightOpen className="size-4" aria-hidden />}
          {panelOpen ? 'ซ่อนแผง' : 'แสดงแผง'}
        </button>
        {panelOpen && (
          <div id="explorer-panels" className="flex w-full flex-col gap-3 [&>*]:pointer-events-auto">
            <UnitPanel x={x} />
            <OverlayPanel title="เครื่องมือเลือกห้อง" className="p-3"><ExplorerTabs x={x} /></OverlayPanel>
          </div>
        )}
      </div>
    </div>
  );
}
