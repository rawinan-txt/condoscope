import type { Facade } from '@condoscope/shared';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import BuildingSvg from './BuildingSvg';
import ThreeBoundary from './ThreeBoundary';
import type { Direction, ExplorerApi } from './useExplorer';

const Building3D = lazy(() => import('./Building3D'));

const toggle = (on: boolean) =>
  `rounded-md px-3 py-1 text-sm ${on ? 'bg-accent text-white' : 'border border-slate-300 bg-white hover:bg-slate-50'}`;

function hasWebGL(): boolean {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

const KEY_DIR: Record<string, Direction> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };

/** 3D building when WebGL works, otherwise (or on request) the SVG elevation. Keyboard works in both. */
export default function BuildingView({ x }: { x: ExplorerApi }) {
  const [gl, setGl] = useState(hasWebGL);
  const [mode, setMode] = useState<'3d' | '2d'>(gl ? '3d' : '2d');
  const [buildingId, setBuildingId] = useState(x.buildings[0].id);
  const [facade, setFacade] = useState<Facade>('front');
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
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 p-2">
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
      {!gl && <p role="status" className="px-3 text-sm text-slate-600">เครื่องนี้แสดง 3D ไม่ได้ กำลังแสดงภาพด้านหน้าตึกแทน</p>}
      <div
        className="min-h-0 flex-1 p-2"
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label="เลือกห้องจากตึก ใช้ลูกศรเลื่อนไปห้องข้างๆ หรือชั้นบนล่าง Enter เปิดรายละเอียด Esc ยกเลิก"
      >
        {mode === '3d' ? (
          <ThreeBoundary onError={lost} fallback={<BuildingSvg x={x} building={building} facade={facade} />}>
            <Suspense fallback={<div className="flex h-full items-center justify-center text-slate-500">กำลังโหลดตึก 3D…</div>}>
              <Building3D x={x} onUnavailable={lost} />
            </Suspense>
          </ThreeBoundary>
        ) : (
          <BuildingSvg x={x} building={building} facade={facade} />
        )}
      </div>
    </div>
  );
}
