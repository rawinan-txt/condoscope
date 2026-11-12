import { formatMillion, UNIT_TYPE_LABEL, type TypeAvailability } from '@condoscope/shared';

export default function Availability({ rows }: { rows: TypeAvailability[] }) {
  return (
    <table aria-label="ห้องว่างแยกตามประเภท" className="w-full text-left text-sm">
      <thead className="border-b border-ink/15 text-stone">
        <tr><th className="py-2 font-medium">ประเภทห้อง</th><th className="py-2 font-medium">ห้องว่าง</th><th className="py-2 font-medium">ราคาเริ่มต้น</th></tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.unit_type} className="border-b border-ink/15">
            <td className="py-2">{UNIT_TYPE_LABEL[r.unit_type] ?? r.unit_type}</td>
            <td className="py-2">{r.available > 0 ? `${r.available} ห้อง` : 'ไม่มีห้องว่าง'}</td>
            <td className="py-2">{r.min_price === null ? '—' : formatMillion(r.min_price)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
