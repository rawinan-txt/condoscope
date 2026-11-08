import { formatTHB, UNIT_TYPE_LABEL, type UnitView } from '@condoscope/shared';
import { effectiveStatus } from './reservations';
import { STATUS_STYLE } from './status';

/** Positioned at (left, top) px inside the nearest relatively positioned container. */
export default function UnitTooltip({ unit, mine, left, top }: { unit: UnitView; mine: Set<number>; left: number; top: number }) {
  const s = STATUS_STYLE[effectiveStatus(unit, mine)];
  return (
    <div role="tooltip" className="pointer-events-none absolute z-10 w-52 rounded-md border border-slate-200 bg-white/95 p-2 text-xs shadow-lg" style={{ left, top }}>
      <p className="text-sm font-semibold">ห้อง {unit.unit_number}</p>
      <p>ชั้น {unit.floor_number} · {UNIT_TYPE_LABEL[unit.unit_type]}</p>
      <p>{unit.area_sqm} ตร.ม. · {unit.bedrooms} ห้องนอน · {unit.bathrooms} ห้องน้ำ</p>
      <p className="font-semibold">{formatTHB(unit.price)}</p>
      <p className="mt-1 inline-flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden />{s.label}</p>
    </div>
  );
}
