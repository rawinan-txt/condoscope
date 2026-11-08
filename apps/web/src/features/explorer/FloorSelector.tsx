import type { ExplorerApi } from './useExplorer';

export default function FloorSelector({ x }: { x: ExplorerApi }) {
  const value = x.cutFloor ? `${x.cutFloor.building_id}:${x.cutFloor.floor}` : '';
  return (
    <label className="block text-sm">
      <span className="font-medium">ดูทีละชั้น</span>
      <select
        className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5"
        value={value}
        onChange={(e) => {
          const [b, f] = e.target.value.split(':').map(Number);
          x.setCutFloor(e.target.value ? { building_id: b, floor: f } : null);
        }}
      >
        <option value="">ทั้งโครงการ</option>
        {x.buildings.map((b) => (
          <optgroup key={b.id} label={b.name}>
            {Array.from({ length: b.last_res_floor - b.first_res_floor + 1 }, (_, i) => b.last_res_floor - i).map((f) => (
              <option key={f} value={`${b.id}:${f}`}>{b.name} ชั้น {f}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
