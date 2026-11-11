import { formatTHB, UNIT_TYPE_LABEL } from '@condoscope/shared';
import { X } from 'lucide-react';
import { Link } from 'react-router';
import OverlayPanel from '../../components/OverlayPanel';
import { effectiveStatus } from './reservations';
import { STATUS_STYLE } from './status';
import type { ExplorerApi } from './useExplorer';

/** Details of the selected room, shown in a floating panel. */
export default function UnitPanel({ x }: { x: ExplorerApi }) {
  const u = x.unit(x.selectedId);
  if (!u) return null;
  const building = x.buildings.find((b) => b.id === u.building_id)!;
  const status = effectiveStatus(u, x.mine);
  const s = STATUS_STYLE[status];

  return (
    <OverlayPanel title="รายละเอียดห้อง" className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="glass-muted text-xs">{building.name} · ชั้น {u.floor_number}</p>
          <h2 className="text-lg font-semibold">ห้อง {u.unit_number}</h2>
        </div>
        <button type="button" onClick={() => x.select(null)} aria-label="ปิดรายละเอียดห้อง" className="rounded p-1 hover:bg-white/10">
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <p className="mt-1 inline-flex items-center gap-1.5 text-sm"><span className="size-2.5 rounded-full" style={{ background: s.color }} aria-hidden />{s.label}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="glass-muted">ประเภท</dt><dd>{UNIT_TYPE_LABEL[u.unit_type]}</dd>
        <dt className="glass-muted">พื้นที่</dt><dd>{u.area_sqm} ตร.ม.</dd>
        <dt className="glass-muted">ห้องนอน / ห้องน้ำ</dt><dd>{u.bedrooms} / {u.bathrooms}</dd>
        <dt className="glass-muted">ทิศ</dt><dd>{u.direction}</dd>
        <dt className="glass-muted">ราคา</dt><dd className="font-semibold">{formatTHB(u.price)}</dd>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/unit/${u.id}`} className="glass-accent rounded-md px-3 py-1.5 text-sm hover:brightness-110">ดูรายละเอียดห้อง</Link>
        <button type="button" onClick={() => x.setCutFloor({ building_id: u.building_id, floor: u.floor_number })} className="rounded-md border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10">
          ดูทั้งชั้น {u.floor_number}
        </button>
        {status === 'mine' ? (
          <button type="button" onClick={() => x.cancelReservation(u.id)} className="rounded-md border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10">ยกเลิกการจอง (Demo)</button>
        ) : (
          <button type="button" disabled={u.status !== 'available'} onClick={() => x.reserve(u.id)} className="rounded-md border border-sky-300 px-3 py-1.5 text-sm text-sky-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:border-white/20 disabled:text-slate-400">
            จองห้องนี้ (Demo)
          </button>
        )}
      </div>
      <p className="mt-2 text-xs glass-muted">การจองนี้เป็นการสาธิต เก็บไว้ในเบราว์เซอร์นี้เท่านั้น ไม่มีการส่งข้อมูลใดๆ</p>
    </OverlayPanel>
  );
}
