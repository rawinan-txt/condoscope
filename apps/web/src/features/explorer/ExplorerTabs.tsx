import { useId, useRef, useState } from 'react';
import Filters from './Filters';
import FloorSelector from './FloorSelector';
import UnitList from './UnitList';
import type { ExplorerApi } from './useExplorer';

const TABS = [
  { id: 'rooms', label: 'ห้อง' },
  { id: 'filters', label: 'ตัวกรอง' },
  { id: 'floor', label: 'ชั้น' },
] as const;

/** Rooms / filters / floors as ARIA tabs (arrow keys, Home, End; only the active panel is in the page). */
export default function ExplorerTabs({ x }: { x: ExplorerApi }) {
  const [active, setActive] = useState(0);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const go = (i: number) => { const n = (i + TABS.length) % TABS.length; setActive(n); refs.current[n]?.focus(); };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const next = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: TABS.length - 1 }[e.key];
    if (next !== undefined) { e.preventDefault(); go(next); }
  };

  return (
    <div>
      <div role="tablist" aria-label="เครื่องมือเลือกห้อง" onKeyDown={onKeyDown} className="mb-3 flex gap-1 rounded-lg bg-white/10 p-1">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => { refs.current[i] = el; }}
            id={`${base}-tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls={`${base}-panel`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={`flex-1 rounded-md px-2 py-1 text-sm ${i === active ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-tab-${TABS[active].id}`}>
        {active === 0 && <UnitList x={x} />}
        {active === 1 && <Filters x={x} />}
        {active === 2 && <FloorSelector x={x} />}
      </div>
    </div>
  );
}
