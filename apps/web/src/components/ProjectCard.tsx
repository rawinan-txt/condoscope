import { formatMillion, type Project } from '@condoscope/shared';
import { Link } from 'react-router';

/** One link per card (a stretched pseudo-element makes the whole card clickable without nesting anchors). */
export default function ProjectCard({ project: p }: { project: Project }) {
  return (
    <article className="group relative flex flex-col">
      <div className="overflow-hidden bg-ink/5">
        {p.thumbnail_url ? (
          <img src={`${import.meta.env.BASE_URL}${p.thumbnail_url}`} alt={`ภาพโครงการ ${p.name}`} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.03]" />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center text-sm text-stone">ยังไม่มีภาพโครงการ</div>
        )}
      </div>
      {p.is_featured && <span className="absolute left-2 top-2 bg-champagne px-2 py-0.5 text-xs font-medium text-ink">แนะนำ</span>}
      <div className="flex flex-1 flex-col gap-1 pt-4">
        <h3 className="font-serif text-2xl">{p.name}</h3>
        <p className="text-sm text-stone">{p.neighborhood} · {p.province}</p>
        <p className="mt-1 font-semibold text-bronze">เริ่มต้น {formatMillion(p.starting_price)}</p>
        <p className="text-sm text-stone">{p.total_floors} ชั้น · {p.total_units} ห้อง</p>
        <Link to={`/project/${p.id}`} className="mt-3 inline-block self-start text-sm font-medium underline decoration-champagne decoration-2 underline-offset-4 after:absolute after:inset-0 group-hover:text-bronze">
          ดูรายละเอียด
        </Link>
      </div>
    </article>
  );
}
