import { formatMillion } from '@condoscope/shared';
import { useMemo } from 'react';
import { effectiveStatus } from './reservations';
import { STATUS_STYLE } from './status';
import type { ExplorerApi } from './useExplorer';

/** Plain HTML alternative to picking from the building: works with keyboard and screen readers. */
export default function UnitList({ x }: { x: ExplorerApi }) {
  const codes = useMemo(() => new Map(x.buildings.map((b) => [b.id, b.building_code])), [x.buildings]);
  const rows = useMemo(() => x.units
    .filter((u) => (!x.cutFloor || (u.building_id === x.cutFloor.building_id && u.floor_number === x.cutFloor.floor)) && x.matches(u))
    .sort((a, b) => a.building_id - b.building_id || b.floor_number - a.floor_number || a.unit_number.localeCompare(b.unit_number)),
  [x.units, x.cutFloor, x.matches]);

  return (
    <div className="max-h-[min(20rem,38dvh)] overflow-auto rounded-md border border-white/15">
      <table className="w-full whitespace-nowrap text-sm">
        <caption className="sr-only">รายการห้อง</caption>
        <thead className="sticky top-0 bg-ink text-left text-ink-muted">
          <tr><th className="px-2 py-1.5 font-medium">ห้อง</th><th className="px-2 py-1.5 font-medium">ตร.ม.</th><th className="px-2 py-1.5 font-medium">ราคา</th><th className="px-2 py-1.5 font-medium">สถานะ</th></tr>
        </thead>
        <tbody>
          {rows.map((u) => {
            const s = STATUS_STYLE[effectiveStatus(u, x.mine)];
            const selected = u.id === x.selectedId;
            return (
              <tr key={u.id} className={selected ? 'bg-champagne/25' : 'hover:bg-white/10'}>
                <td className="px-2 py-1">
                  <button
                    type="button"
                    className="font-medium text-champagne-soft hover:underline"
                    aria-label={`ห้อง ${u.unit_number} ชั้น ${u.floor_number} ${s.label}`}
                    aria-pressed={selected}
                    onClick={() => x.select(u.id)}
                  >
                    {u.unit_number}
                  </button>
                  {codes.size > 1 && <span className="sr-only">อาคาร {codes.get(u.building_id)}</span>}
                </td>
                <td className="px-2 py-1">{u.area_sqm}</td>
                <td className="px-2 py-1">{formatMillion(u.price)}</td>
                <td className="whitespace-normal px-2 py-1">
                  <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden />{s.label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <p className="p-4 text-center text-sm text-slate-300">ไม่มีห้องที่ตรงเงื่อนไข</p>}
    </div>
  );
}
