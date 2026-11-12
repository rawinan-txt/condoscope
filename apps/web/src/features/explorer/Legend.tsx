import { DISPLAY_ORDER, STATUS_STYLE } from './status';

export default function Legend() {
  return (
    <ul aria-label="สถานะห้อง" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {DISPLAY_ORDER.map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm ring-1 ring-ivory" style={{ background: STATUS_STYLE[s].color }} aria-hidden />
          <span>{STATUS_STYLE[s].label}</span>
        </li>
      ))}
    </ul>
  );
}
