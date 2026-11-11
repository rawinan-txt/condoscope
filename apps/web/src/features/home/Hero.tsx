import { sanitizeSearchParams, toQueryRecord, type Project } from '@condoscope/shared';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import HeroImage from '../../components/HeroImage';
import { scrimBackground } from '../../components/theme';
import { useReveal } from '../../hooks/useReveal';
import { FIELD_CLASS, PRICE_STEPS } from '../search/options';

const field = FIELD_CLASS;

/** The search box is the main thing on the home page (spec 8.1). Submitting opens /search with the filters in the URL. */
export default function Hero({ projects }: { projects: Project[] }) {
  const navigate = useNavigate();
  const reveal = useReveal<HTMLHeadingElement>();
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
    <section className="relative isolate flex min-h-[max(560px,calc(100svh-3.5rem))] flex-col justify-end overflow-hidden bg-ink">
      {featured && <div className="absolute inset-0 -z-20 overflow-hidden"><HeroImage project={featured} priority className="hero-settle" /></div>}
      <div className="absolute inset-0 -z-10" style={{ background: scrimBackground }} aria-hidden />
      <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-24 md:pb-16">
        <h1 className="reveal max-w-3xl text-4xl font-semibold leading-tight text-white md:text-6xl" ref={reveal}>ค้นหาคอนโดที่ใช่ แล้วเลือกห้องจากตัวตึกได้เลย</h1>
        <p className="mt-4 max-w-xl text-white md:text-lg">โครงการจำลอง 5 แห่งในกรุงเทพฯ และปริมณฑล ดูตึก 3 มิติ เลือกห้อง ดูแปลน</p>
        <form onSubmit={submit} className="mt-8 bg-ivory p-4 text-ink shadow-2xl md:p-5">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end">
            <label className="block text-sm font-medium">
              ชื่อโครงการหรือทำเล
              <input type="text" value={form.q} onChange={set('q')} maxLength={100} placeholder="เช่น อารีย์ หรือ Noventa" className={`${field} py-2.5`} />
            </label>
            <label className="block text-sm font-medium">จังหวัด
              <select value={form.province} onChange={set('province')} className={field}>
                <option value="">ทุกจังหวัด</option>
                {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
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
            <button type="submit" className="inline-flex items-center justify-center gap-2 bg-champagne px-8 py-2.5 font-medium text-ink hover:bg-champagne-soft md:col-span-2 lg:col-span-1">
              <Search className="size-4" aria-hidden />ค้นหา
            </button>
          </div>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-bronze underline underline-offset-4">ตัวกรองเพิ่มเติม</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
              <label className="block font-medium">เขต
                <select value={form.district} onChange={set('district')} className={field}>
                  <option value="">ทุกเขต</option>
                  {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label className="block font-medium">ราคาต่ำสุด
                <select value={form.minPrice} onChange={set('minPrice')} className={field}>
                  <option value="">ไม่กำหนด</option>
                  {PRICE_STEPS.map((m) => <option key={m} value={m * 1_000_000}>{m} ล้านบาท</option>)}
                </select>
              </label>
            </div>
          </details>
        </form>
      </div>
    </section>
  );
}
