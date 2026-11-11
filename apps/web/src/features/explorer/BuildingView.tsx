import type { Facade } from '@condoscope/shared';
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import OverlayPanel from '../../components/OverlayPanel';
import BuildingSvg from './BuildingSvg';
import type { TimeOfDay } from './scene/time';
import ThreeBoundary from './ThreeBoundary';
import type { Direction, ExplorerApi } from './useExplorer';

const Building3D = lazy(() => import('./Building3D'));

const toggle = (on: boolean) =>
  `rounded-md px-3 py-1 text-sm ${on ? 'glass-accent' : 'border border-white/30 hover:bg-white/10'}`;

function hasWebGL(): boolean {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

const KEY_DIR: Record<string, Direction> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };

/**
 * 3D building when WebGL works, otherwise (or on request) the SVG elevation, filling its parent. Keyboard works in both.
 * `header` and `footer` are floating panels (title, legend) stacked in the left column with the view controls.
 */
export default function BuildingView({ x, header, footer }: { x: ExplorerApi; header: ReactNode; footer: ReactNode }) {
  const [gl, setGl] = useState(hasWebGL);
  const [mode, setMode] = useState<'3d' | '2d'>(gl ? '3d' : '2d');
  const [buildingId, setBuildingId] = useState(x.buildings[0].id);
  const [facade, setFacade] = useState<Facade>('front');
  const [time, setTime] = useState<TimeOfDay>('dusk');
  const navigate = useNavigate();
  const selected = x.unit(x.selectedId);
  // follow the selection (from the list or keyboard) to the tower/facade it is on
  useEffect(() => {
    if (selected) { setBuildingId(selected.building_id); setFacade(selected.facade); }
  }, [selected]);
  const building = x.buildings.find((b) => b.id === buildingId) ?? x.buildings[0];

  const lost = () => { setGl(false); setMode('2d'); };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const dir = KEY_DIR[e.key];
    if (dir) { e.preventDefault(); x.move(dir); }
    else if (e.key === 'Enter' && x.selectedId !== null) navigate(`/unit/${x.selectedId}`);
    else if (e.key === 'Escape') x.select(null);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute z-10 inset-y-3 left-3 flex w-[min(20rem,calc(100%-1.5rem))] flex-col justify-between gap-3 md:inset-y-4 md:left-4">
        <div className="space-y-3">
          {header}
          <OverlayPanel title="มุมมอง" className="space-y-2 p-2">
            <div className="flex flex-wrap items-center gap-2">
              {gl && (['3d', '2d'] as const).map((m) => (
                <button key={m} type="button" aria-pressed={mode === m} className={toggle(mode === m)} onClick={() => setMode(m)}>{m === '3d' ? 'ตึก 3D' : 'ภาพด้านตึก 2D'}</button>
              ))}
              {mode === '2d' && (
                <>
                  {x.buildings.length > 1 && x.buildings.map((b) => (
                    <button key={b.id} type="button" aria-pressed={b.id === building.id} className={toggle(b.id === building.id)} onClick={() => setBuildingId(b.id)}>{b.name}</button>
                  ))}
                  {(['front', 'back'] as const).map((f) => (
                    <button key={f} type="button" aria-pressed={f === facade} className={toggle(f === facade)} onClick={() => setFacade(f)}>{f === 'front' ? 'ด้านหน้า' : 'ด้านหลัง'}</button>
                  ))}
                </>
              )}
            </div>
            {mode === '3d' && (
              <div role="group" aria-label="ช่วงเวลา" className="flex flex-wrap gap-2">
                {(['dusk', 'day'] as const).map((t) => (
                  <button key={t} type="button" aria-pressed={time === t} className={toggle(time === t)} onClick={() => setTime(t)}>{t === 'dusk' ? 'พลบค่ำ' : 'กลางวัน'}</button>
                ))}
              </div>
            )}
            {!gl && <p role="status" className="glass-muted text-sm">เครื่องนี้แสดง 3D ไม่ได้ กำลังแสดงภาพด้านหน้าตึกแทน</p>}
          </OverlayPanel>
        </div>
        {footer}
      </div>
      <div
        role="group"
        className="absolute inset-0 outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-sky-300"
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label="เลือกห้องจากตึก ใช้ลูกศรเลื่อนไปห้องข้างๆ หรือชั้นบนล่าง Enter เปิดรายละเอียด Esc ยกเลิก"
      >
        {mode === '3d' ? (
          <ThreeBoundary onError={lost} fallback={<BuildingSvg x={x} building={building} facade={facade} />}>
            <Suspense fallback={<div className="flex h-full items-center justify-center text-slate-500">กำลังโหลดตึก 3D…</div>}>
              <Building3D x={x} time={time} onUnavailable={lost} />
            </Suspense>
          </ThreeBoundary>
        ) : (
          <BuildingSvg x={x} building={building} facade={facade} />
        )}
      </div>
    </div>
  );
}
