import type { ProjectSearchParams } from '@condoscope/shared';
import { useEffect, useState } from 'react';
import { FIELD_CLASS, PRICE_STEPS } from './options';
import { useFilterOptions } from './useFilterOptions';

const text = (s: string) => (s === '' ? undefined : s);
const whole = (s: string) => (s === '' ? undefined : Number(s));

/** Filters shared by the search page and the map page. Selects apply at once; the text box on Enter or when it loses focus. */
export default function FiltersPanel({ value, onChange }: { value: ProjectSearchParams; onChange(p: ProjectSearchParams): void }) {
  const options = useFilterOptions();
  const [q, setQ] = useState(value.q ?? '');
  useEffect(() => setQ(value.q ?? ''), [value.q]);
  const patch = (p: Partial<ProjectSearchParams>) => onChange({ ...value, ...p, offset: undefined });
  const commitText = () => { if ((text(q.trim()) ?? '') !== (value.q ?? '')) patch({ q: text(q.trim()) }); };

  return (
    <form onSubmit={(e) => { e.preventDefault(); commitText(); }} className="space-y-3">
      <label className="block text-sm font-medium">ชื่อโครงการหรือทำเล
        <input type="text" value={q} maxLength={100} onChange={(e) => setQ(e.target.value)} onBlur={commitText} className={FIELD_CLASS} />
      </label>
      <label className="block text-sm font-medium">จังหวัด
        <select value={value.province ?? ''} onChange={(e) => patch({ province: text(e.target.value), district: undefined })} className={FIELD_CLASS}>
          <option value="">ทุกจังหวัด</option>
          {options.provinces.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
      <label className="block text-sm font-medium">เขต
        <select value={value.district ?? ''} onChange={(e) => patch({ district: text(e.target.value) })} className={FIELD_CLASS}>
          <option value="">ทุกเขต</option>
          {options.districts(value.province).map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium">ราคาต่ำสุด
          <select value={value.minPrice ?? ''} onChange={(e) => patch({ minPrice: whole(e.target.value) })} className={FIELD_CLASS}>
            <option value="">ไม่กำหนด</option>
            {PRICE_STEPS.map((m) => <option key={m} value={m * 1_000_000}>{m} ล้านบาท</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">ราคาสูงสุด
          <select value={value.maxPrice ?? ''} onChange={(e) => patch({ maxPrice: whole(e.target.value) })} className={FIELD_CLASS}>
            <option value="">ไม่กำหนด</option>
            {PRICE_STEPS.map((m) => <option key={m} value={m * 1_000_000}>{m} ล้านบาท</option>)}
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium">จำนวนห้องนอน
        <select value={value.bedrooms ?? ''} onChange={(e) => patch({ bedrooms: e.target.value === '' ? undefined : (Number(e.target.value) as 0 | 1 | 2) })} className={FIELD_CLASS}>
          <option value="">ทุกแบบ</option>
          <option value="0">สตูดิโอ</option>
          <option value="1">1 ห้องนอน</option>
          <option value="2">2 ห้องนอน</option>
        </select>
      </label>
    </form>
  );
}
