import { sanitizeSearchParams, toQueryRecord, type Project } from '@condoscope/shared';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

const PRICE_STEPS = [2, 3, 4, 5, 7, 10, 15]; // million baht
const field = 'mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm';

/** The search box is the main thing on the home page (spec 8.1). Submitting opens /search with the filters in the URL. */
export default function Hero({ projects }: { projects: Project[] }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ q: '', province: '', district: '', minPrice: '', maxPrice: '', bedrooms: '' });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value, ...(k === 'province' ? { district: '' } : {}) }));

  const provinces = useMemo(() => [...new Set(projects.map((p) => p.province))], [projects]);
  const districts = useMemo(
    () => [...new Set(projects.filter((p) => !form.province || p.province === form.province).map((p) => p.district))],
    [projects, form.province],
  );
  const featured = projects.find((p) => p.is_featured) ?? projects[0];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const qs = new URLSearchParams(toQueryRecord(sanitizeSearchParams(form))).toString();
    navigate(qs ? `/search?${qs}` : '/search');
  }

  return (
    <section className="relative isolate bg-slate-900">
      {featured?.thumbnail_url && (
        <img src={`${import.meta.env.BASE_URL}${featured.thumbnail_url}`} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" />
      )}
      <div className="mx-auto max-w-5xl px-4 py-12 md:py-20">
        <h1 className="text-3xl font-bold text-white md:text-4xl">ค้นหาคอนโดที่ใช่ แล้วเลือกห้องจากตัวตึกได้เลย</h1>
        <p className="mt-2 text-slate-200">โครงการจำลอง 5 แห่งในกรุงเทพฯ และปริมณฑล ดูตึก 3 มิติ เลือกห้อง ดูแปลน</p>
        <form onSubmit={submit} className="mt-8 rounded-lg bg-white p-4 shadow-lg">
          <label className="block text-sm font-medium">
            ชื่อโครงการหรือทำเล
            <input type="text" value={form.q} onChange={set('q')} maxLength={100} placeholder="เช่น อารีย์ หรือ Noventa" className={`${field} py-3 text-base`} />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="block text-sm font-medium">จังหวัด
              <select value={form.province} onChange={set('province')} className={field}>
                <option value="">ทุกจังหวัด</option>
                {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">เขต
              <select value={form.district} onChange={set('district')} className={field}>
                <option value="">ทุกเขต</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">ราคาต่ำสุด
              <select value={form.minPrice} onChange={set('minPrice')} className={field}>
                <option value="">ไม่กำหนด</option>
                {PRICE_STEPS.map((m) => <option key={m} value={m * 1_000_000}>{m} ล้านบาท</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">ราคาสูงสุด
              <select value={form.maxPrice} onChange={set('maxPrice')} className={field}>
                <option value="">ไม่กำหนด</option>
                {PRICE_STEPS.map((m) => <option key={m} value={m * 1_000_000}>{m} ล้านบาท</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">จำนวนห้องนอน
              <select value={form.bedrooms} onChange={set('bedrooms')} className={field}>
                <option value="">ทุกแบบ</option>
                <option value="0">สตูดิโอ</option>
                <option value="1">1 ห้องนอน</option>
                <option value="2">2 ห้องนอน</option>
              </select>
            </label>
          </div>
          <button type="submit" className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-hover">
            <Search className="size-4" aria-hidden />ค้นหา
          </button>
        </form>
      </div>
    </section>
  );
}
