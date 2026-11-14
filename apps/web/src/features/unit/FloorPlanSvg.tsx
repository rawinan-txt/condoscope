import type { FloorPlan, RoomKey } from '@condoscope/shared';

const FILL: Record<RoomKey, string> = {
  living: '#f8fafc', bedroom: '#eef2ff', bedroom2: '#eef2ff', kitchen: '#fefce8', bathroom: '#ecfeff', balcony: '#f0fdf4',
};

/** Floor plan from the unit-type template; hotspots are real buttons placed in % over the drawing. */
export default function FloorPlanSvg({ plan, active, onPick }: { plan: FloorPlan; active: RoomKey; onPick(k: RoomKey): void }) {
  return (
    <div role="group" aria-label="แปลนห้อง" className="relative mx-auto max-h-[480px] w-full" style={{ aspectRatio: String(plan.aspect), maxWidth: `${480 * plan.aspect}px` }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        {plan.rooms.map((r, i) => (
          <g key={i}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={FILL[r.key]} stroke="#334155" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
        <line x1={0} y1={0} x2={100} y2={0} stroke="#334155" strokeWidth={5} vectorEffect="non-scaling-stroke" />
      </svg>
      {plan.rooms.map((r, i) => (
        <span key={i} className="pointer-events-none absolute text-[11px] text-stone" style={{ left: `${r.x + 2}%`, top: `${r.y + 2}%` }} aria-hidden>{r.label}</span>
      ))}
      {plan.hotspots.map((h) => (
        <button
          key={h.key}
          type="button"
          aria-label={`ดูภาพ ${h.label}`}
          aria-pressed={h.key === active}
          onClick={() => onPick(h.key)}
          className={`absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-2 transition ${h.key === active ? 'bg-champagne ring-ink' : 'bg-stone ring-white/70 hover:bg-ink'}`}
          style={{ left: `${h.x}%`, top: `${h.y}%` }}
        >
          <span className="sr-only">{h.label}</span>
        </button>
      ))}
    </div>
  );
}
