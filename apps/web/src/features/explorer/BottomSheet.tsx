import { formatMillion } from '@condoscope/shared';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import OverlayPanel from '../../components/OverlayPanel';
import ExplorerTabs from './ExplorerTabs';
import { effectiveStatus } from './reservations';
import { STATUS_STYLE } from './status';
import UnitPanel from './UnitPanel';
import type { ExplorerApi } from './useExplorer';

type SheetState = 'peek' | 'open' | 'hidden';

/**
 * Phone layout: a sheet at the bottom with three states, switched by buttons (no drag gesture, so it works with a keyboard
 * and never fights the touch rotation of the building). Peek shows one line, open shows the details and tabs.
 */
export default function BottomSheet({ x, legend }: { x: ExplorerApi; legend: ReactNode }) {
  const [state, setState] = useState<SheetState>('peek');
  const u = x.unit(x.selectedId);
  // a room picked while the sheet is hidden brings it back as a peek (never expanded: that would cover the building)
  useEffect(() => { if (x.selectedId !== null) setState((s) => (s === 'hidden' ? 'peek' : s)); }, [x.selectedId]);

  if (state === 'hidden') {
    return (
      <button type="button" onClick={() => setState('peek')} className="glass pointer-events-auto absolute bottom-3 right-3 rounded-lg px-3 py-2 text-sm">
        แสดงแผงห้อง
      </button>
    );
  }

  const open = state === 'open';
  const s = u && STATUS_STYLE[effectiveStatus(u, x.mine)];
  return (
    <OverlayPanel title="แผงห้อง" className="absolute inset-x-0 bottom-0 rounded-b-none rounded-t-2xl px-3 pb-3 pt-2">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 text-sm">
          {open ? <span className="font-medium">เลือกห้อง</span> : u && s ? (
            <span>ห้อง {u.unit_number} · {s.label} · {formatMillion(u.price)}</span>
          ) : (
            <span className="glass-muted">แตะห้องบนตึก หรือขยายแผงเพื่อเลือกจากรายการ</span>
          )}
        </div>
        {!open && u && (
          <Link to={`/unit/${u.id}`} className="glass-accent shrink-0 rounded-md px-2.5 py-1 text-sm">ดูรายละเอียดห้อง</Link>
        )}
        <button
          type="button"
          aria-label={open ? 'ย่อแผง' : 'ขยายแผง'}
          aria-expanded={open}
          onClick={() => setState(open ? 'peek' : 'open')}
          className="shrink-0 rounded p-1.5 hover:bg-white/10"
        >
          {open ? <ChevronDown className="size-5" aria-hidden /> : <ChevronUp className="size-5" aria-hidden />}
        </button>
        <button type="button" aria-label="ซ่อนแผงห้อง" onClick={() => setState('hidden')} className="shrink-0 rounded p-1.5 hover:bg-white/10">
          <X className="size-5" aria-hidden />
        </button>
      </div>
      {open && (
        <div className="mt-2 max-h-[min(60dvh,32rem)] space-y-3 overflow-y-auto">
          <UnitPanel x={x} bare />
          <OverlayPanel title="เครื่องมือเลือกห้อง" bare><ExplorerTabs x={x} /></OverlayPanel>
          {legend}
        </div>
      )}
    </OverlayPanel>
  );
}
