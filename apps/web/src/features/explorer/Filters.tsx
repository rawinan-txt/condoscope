import type { ExplorerApi } from './useExplorer';

const PRICE_STEPS = [2_000_000, 3_000_000, 4_000_000, 5_000_000, 7_000_000, 10_000_000];

export default function Filters({ x }: { x: ExplorerApi }) {
  const { filters } = x;
  return (
    <fieldset className="space-y-2 text-sm">
      <legend className="font-medium">ตัวกรอง (ห้องที่ตรงเงื่อนไขจะสว่างขึ้น)</legend>
      <div className="flex gap-2">
        <label className="flex-1">
          <span className="sr-only">ราคาสูงสุด</span>
          <select
            className="block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5"
            value={filters.maxPrice ?? ''}
            onChange={(e) => x.setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">ทุกราคา</option>
            {PRICE_STEPS.map((p) => <option key={p} value={p}>ไม่เกิน {p / 1e6} ล้าน</option>)}
          </select>
        </label>
        <label className="flex-1">
          <span className="sr-only">จำนวนห้องนอน</span>
          <select
            className="block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5"
            value={filters.bedrooms ?? ''}
            onChange={(e) => x.setFilters({ ...filters, bedrooms: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">ทุกแบบ</option>
            <option value="0">สตูดิโอ</option>
            <option value="1">1 ห้องนอน</option>
            <option value="2">2 ห้องนอน</option>
          </select>
        </label>
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={x.statusMode} onChange={(e) => x.setStatusMode(e.target.checked)} />
        แสดงสีตามสถานะห้องทั้งโครงการ
      </label>
    </fieldset>
  );
}
