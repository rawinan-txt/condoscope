import { formatTHB, type UnitDetailPayload } from '@condoscope/shared';
import { useState } from 'react';
import { Link } from 'react-router';
import { LoadError } from '../../components/NotFound';
import { useResource } from '../../hooks/useResource';
import { getUnit, type Result, type Source } from '../../services/api';
import { loadReservations, saveReservations } from '../explorer/reservations';
import { useReservationIds } from './useReservationIds';

interface Entry { id: number; detail: UnitDetailPayload | null }

/** One request per reserved unit (a handful at most). A unit that cannot be loaded is kept as an unusable entry. */
async function loadReserved(ids: number[]): Promise<Result<Entry[]>> {
  const settled = await Promise.allSettled(ids.map((id) => getUnit(id)));
  let source: Source = 'live';
  const data = settled.map((s, i): Entry => {
    if (s.status !== 'fulfilled') return { id: ids[i], detail: null };
    if (s.value.source === 'fallback') source = 'fallback';
    return { id: ids[i], detail: s.value.data };
  });
  return { data, source };
}

function remove(id: number) {
  const next = loadReservations();
  next.delete(id);
  saveReservations(next);
}

export default function ReservationsPage() {
  const ids = useReservationIds();
  const [initial] = useState(ids); // what to fetch: reservations are only removed on this page, never added
  const r = useResource(() => loadReserved(initial), []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">รายการที่จองไว้ (Demo)</h1>
      <p className="mt-1 text-sm text-stone">การจองนี้เป็นการสาธิต เก็บไว้ในเบราว์เซอร์นี้เท่านั้น ไม่มีการส่งข้อมูลใดๆ</p>
      {r.state === 'loading' && <p className="mt-6 text-stone">กำลังโหลด…</p>}
      {(r.state === 'error' || r.state === 'missing') && <LoadError onRetry={r.state === 'error' ? r.retry : () => location.reload()} />}
      {r.state === 'ok' && <List entries={r.data.filter((e) => ids.includes(e.id))} />}
    </div>
  );
}

function List({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return (
      <div className="mt-8 text-center">
        <p className="text-stone">ยังไม่มีรายการที่จอง</p>
        <Link to="/search" className="mt-3 inline-block rounded-md bg-accent px-4 py-2 text-white hover:bg-accent-hover">ค้นหาคอนโด</Link>
      </div>
    );
  }
  return (
    <ul className="mt-6 divide-y divide-ink/15 rounded-lg border border-ink/15">
      {entries.map(({ id, detail }) => (
        <li key={id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          {detail && detail.unit.status === 'available' ? (
            <>
              <div>
                <p className="font-medium">ห้อง <b>{detail.unit.unit_number}</b></p>
                <p className="text-sm text-stone">{detail.project.name} · {detail.building.name} · ชั้น {detail.unit.floor_number}</p>
                <p className="text-sm">{formatTHB(detail.unit.price)} · คุณจอง (Demo)</p>
              </div>
              <div className="flex gap-2">
                <Link to={`/unit/${id}`} className="rounded-md border border-ink/15 px-3 py-1.5 text-sm hover:bg-ink/5">ดูห้อง</Link>
                <button type="button" onClick={() => remove(id)} className="rounded-md border border-ink/15 px-3 py-1.5 text-sm hover:bg-ink/5">ยกเลิกการจอง (Demo)</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-stone"><b>รายการนี้ใช้ไม่ได้แล้ว</b> เพราะห้องไม่ว่างหรือไม่มีในข้อมูลแล้ว</p>
              <button type="button" onClick={() => remove(id)} className="rounded-md border border-ink/15 px-3 py-1.5 text-sm hover:bg-ink/5">ลบรายการนี้</button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
