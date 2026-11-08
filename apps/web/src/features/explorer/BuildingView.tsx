import type { Facade } from '@condoscope/shared';
import { useEffect, useState } from 'react';
import BuildingSvg from './BuildingSvg';
import type { ExplorerApi } from './useExplorer';

const toggle = (on: boolean) =>
  `rounded-md px-3 py-1 text-sm ${on ? 'bg-accent text-white' : 'border border-slate-300 bg-white hover:bg-slate-50'}`;

/** SVG elevation with tower + facade switches. */
export default function BuildingView({ x }: { x: ExplorerApi }) {
  const [buildingId, setBuildingId] = useState(x.buildings[0].id);
  const [facade, setFacade] = useState<Facade>('front');
  const selected = x.unit(x.selectedId);
  // follow the selection (from the list or keyboard) to the tower/facade it is on
  useEffect(() => {
    if (selected) { setBuildingId(selected.building_id); setFacade(selected.facade); }
  }, [selected]);
  const building = x.buildings.find((b) => b.id === buildingId) ?? x.buildings[0];

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap gap-2 p-2">
        {x.buildings.length > 1 && x.buildings.map((b) => (
          <button key={b.id} type="button" aria-pressed={b.id === building.id} className={toggle(b.id === building.id)} onClick={() => setBuildingId(b.id)}>{b.name}</button>
        ))}
        <span className="mx-1" />
        {(['front', 'back'] as const).map((f) => (
          <button key={f} type="button" aria-pressed={f === facade} className={toggle(f === facade)} onClick={() => setFacade(f)}>{f === 'front' ? 'ด้านหน้า' : 'ด้านหลัง'}</button>
        ))}
      </div>
      <div className="min-h-0 flex-1 p-2">
        <BuildingSvg x={x} building={building} facade={facade} />
      </div>
    </div>
  );
}
