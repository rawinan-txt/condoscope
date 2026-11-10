import { formatMillion, type Project } from '@condoscope/shared';
import { Link } from 'react-router';

/** One link per card (a stretched pseudo-element makes the whole card clickable without nesting anchors). */
export default function ProjectCard({ project: p }: { project: Project }) {
  return (
    <article className="relative flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      {p.thumbnail_url ? (
        <img src={`${import.meta.env.BASE_URL}${p.thumbnail_url}`} alt={`ภาพโครงการ ${p.name}`} loading="lazy" className="aspect-[16/10] w-full object-cover" />
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center bg-slate-100 text-sm text-slate-500">ยังไม่มีภาพโครงการ</div>
      )}
      {p.is_featured && <span className="absolute left-2 top-2 rounded bg-accent px-2 py-0.5 text-xs text-white">แนะนำ</span>}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-semibold">{p.name}</h3>
        <p className="text-sm text-slate-600">{p.neighborhood} · {p.province}</p>
        <p className="mt-1 font-medium">เริ่มต้น {formatMillion(p.starting_price)}</p>
        <p className="text-sm text-slate-600">{p.total_floors} ชั้น · {p.total_units} ห้อง</p>
        <Link to={`/project/${p.id}`} className="mt-3 inline-block rounded-md bg-accent px-3 py-1.5 text-center text-sm text-white hover:bg-accent-hover after:absolute after:inset-0">
          ดูรายละเอียด
        </Link>
      </div>
    </article>
  );
}
