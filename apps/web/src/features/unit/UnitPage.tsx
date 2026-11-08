import { floorPlan, formatTHB, UNIT_TYPE_LABEL, unitDepth, type RoomKey, type UnitDetailPayload } from '@condoscope/shared';
import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useReportSource } from '../../components/Layout';
import NotFound, { LoadError } from '../../components/NotFound';
import { getUnit, NotFoundError } from '../../services/api';
import { effectiveStatus, loadReservations } from '../explorer/reservations';
import { STATUS_STYLE } from '../explorer/status';
import FloorPlanSvg from './FloorPlanSvg';
import ImageViewer, { type ViewerItem } from './ImageViewer';

type Load = { state: 'loading' } | { state: 'ok'; data: UnitDetailPayload } | { state: 'missing' } | { state: 'error' };

export default function UnitPage() {
  const { unitId } = useParams();
  const report = useReportSource();
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const fetchData = useCallback(() => {
    setLoad({ state: 'loading' });
    getUnit(Number(unitId))
      .then((r) => { setLoad({ state: 'ok', data: r.data }); report(r.source); })
      .catch((e) => setLoad({ state: e instanceof NotFoundError ? 'missing' : 'error' }));
  }, [unitId, report]);
  useEffect(fetchData, [fetchData]);

  if (load.state === 'loading') return <div className="mx-auto max-w-6xl animate-pulse px-4 py-8"><div className="h-96 rounded-lg bg-slate-100" /></div>;
  if (load.state === 'missing') return <NotFound message="ไม่พบห้องนี้" />;
  if (load.state === 'error') return <LoadError onRetry={fetchData} />;
  return <UnitDetail key={load.data.unit.id} d={load.data} />;
}

function UnitDetail({ d }: { d: UnitDetailPayload }) {
  const { project, building, unit } = d;
  const plan = useMemo(() => floorPlan(unit.unit_type, building.unit_bay_widths[unit.bay_index], unitDepth(building)), [unit, building]);
  const items: ViewerItem[] = useMemo(() => plan.hotspots.map((h) => {
    const img = d.images.find((i) => i.room_key === h.key);
    return { key: h.key, label: h.label, src: img ? import.meta.env.BASE_URL + img.image_url : null };
  }), [plan, d.images]);
  const [active, setActive] = useState<RoomKey>(plan.hotspots[0].key);
  const status = STATUS_STYLE[effectiveStatus(unit, loadReservations())];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link to={`/explorer/${project.id}?unit=${unit.id}`} className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
        <ArrowLeft className="size-4" aria-hidden />กลับไปเลือกห้อง
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm text-slate-500">{project.name} · {building.name} · ชั้น {unit.floor_number}</p>
          <h1 className="text-2xl font-semibold">ห้อง {unit.unit_number}</h1>
        </div>
        <p className="text-2xl font-semibold">{formatTHB(unit.price)}</p>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-slate-200 p-4 text-sm sm:grid-cols-4">
        <div><dt className="text-slate-500">ประเภท</dt><dd>{UNIT_TYPE_LABEL[unit.unit_type]}</dd></div>
        <div><dt className="text-slate-500">พื้นที่</dt><dd>{unit.area_sqm} ตร.ม.</dd></div>
        <div><dt className="text-slate-500">ห้องนอน / ห้องน้ำ</dt><dd>{unit.bedrooms} / {unit.bathrooms}</dd></div>
        <div><dt className="text-slate-500">ชั้น</dt><dd>{unit.floor_number}</dd></div>
        <div><dt className="text-slate-500">ทิศ</dt><dd>{unit.direction}</dd></div>
        <div><dt className="text-slate-500">ราคาต่อ ตร.ม.</dt><dd>{formatTHB(Math.round(unit.price / unit.area_sqm))}</dd></div>
        <div className="col-span-2"><dt className="text-slate-500">สถานะ</dt><dd className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: status.color }} aria-hidden />{status.label}</dd></div>
      </dl>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section aria-labelledby="plan-h">
          <h2 id="plan-h" className="mb-2 font-semibold">แปลนห้อง <span className="text-sm font-normal text-slate-500">(คลิกจุดเพื่อดูภาพบริเวณนั้น · ประตูอยู่ด้านบน ระเบียงอยู่ด้านล่าง)</span></h2>
          <FloorPlanSvg plan={plan} active={active} onPick={setActive} />
          <p className="mt-2 text-xs text-slate-500">แปลนจำลองตามประเภทห้อง ไม่ใช่แปลนของโครงการจริง</p>
        </section>
        <section aria-labelledby="img-h">
          <h2 id="img-h" className="mb-2 font-semibold">ภาพภายในห้อง</h2>
          <ImageViewer items={items} active={active} onPick={setActive} />
        </section>
      </div>
    </div>
  );
}
