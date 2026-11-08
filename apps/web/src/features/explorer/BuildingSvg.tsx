import { buildingWidth, floorBaseY, unitBox, type Building, type Facade } from '@condoscope/shared';
import { useMemo, useRef, useState } from 'react';
import { effectiveStatus } from './reservations';
import { STATUS_STYLE, unitColorRole } from './status';
import UnitTooltip from './UnitTooltip';
import type { ExplorerApi } from './useExplorer';

/** 2D elevation of one facade, built from the same data as the 3D view (used when WebGL is unavailable). */
export default function BuildingSvg({ x, building, facade }: { x: ExplorerApi; building: Building; facade: Facade }) {
  const W = buildingWidth(building);
  const top = floorBaseY(building, building.last_res_floor + 1);
  const podium = floorBaseY(building, building.first_res_floor);
  const pad = 2;
  const wrap = useRef<HTMLDivElement>(null);
  const [tipAt, setTipAt] = useState<{ left: number; top: number } | null>(null);

  const units = useMemo(
    () => x.units.filter((u) => u.building_id === building.id && u.facade === facade),
    [x.units, building.id, facade],
  );
  const hovered = x.unit(x.hoveredId);

  const place = (e: React.PointerEvent) => {
    const r = wrap.current?.getBoundingClientRect();
    if (r) setTipAt({ left: Math.min(e.clientX - r.left + 14, r.width - 216), top: e.clientY - r.top + 14 });
  };

  return (
    <div ref={wrap} className="relative h-full w-full">
      <svg
        viewBox={`${-W / 2 - pad} ${-pad} ${W + pad * 2} ${top + pad * 2}`}
        className="h-full w-full"
        role="group"
        aria-label={`ภาพ${facade === 'front' ? 'ด้านหน้า' : 'ด้านหลัง'} ${building.name}`}
        onPointerLeave={() => { x.hover(null); setTipAt(null); }}
      >
        <rect x={-W / 2 - 1} y={top - podium} width={W + 2} height={podium} fill="#94a3b8" />
        <rect x={-W / 2} y={0} width={W} height={top - podium} fill="#475569" />
        {units.filter(x.isVisible).map((u) => {
          const b = unitBox(building, u);
          // seen from the back, east is on the viewer's left
          const cx = facade === 'front' ? b.x : -b.x;
          const s = STATUS_STYLE[effectiveStatus(u, x.mine)];
          return (
            <rect
              key={u.id}
              x={cx - b.w / 2 + 0.15}
              y={top - (b.y + b.h / 2) + 0.25}
              width={b.w - 0.3}
              height={b.h - 0.5}
              fill={unitColorRole(x, u).color}
              role="button"
              tabIndex={-1}
              aria-label={`ห้อง ${u.unit_number} ชั้น ${u.floor_number} ${s.label}`}
              className="cursor-pointer"
              onPointerEnter={(e) => { x.hover(u.id); place(e); }}
              onPointerMove={place}
              onClick={() => x.select(u.id)}
            />
          );
        })}
      </svg>
      {hovered && hovered.building_id === building.id && (
        <UnitTooltip unit={hovered} mine={x.mine} left={tipAt?.left ?? 8} top={tipAt?.top ?? 8} />
      )}
    </div>
  );
}
