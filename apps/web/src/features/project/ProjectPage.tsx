import { formatMillion, imageFile, UNIT_TYPE_LABEL, type ProjectDetailPayload } from '@condoscope/shared';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import AmenityIcon from '../../components/AmenityIcon';
import NotFound, { LoadError } from '../../components/NotFound';
import { useResource } from '../../hooks/useResource';
import { getProject } from '../../services/api';
import Availability from './Availability';
import Gallery, { type GalleryItem } from './Gallery';

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

function galleryOf({ project, availability }: ProjectDetailPayload): GalleryItem[] {
  const items: GalleryItem[] = [];
  if (project.thumbnail_url) items.push({ src: asset(project.thumbnail_url), alt: `ภาพโครงการ ${project.name}`, ai: false });
  for (const a of availability) {
    items.push({ src: asset(`images/interiors/${imageFile(a.unit_type, 'living')}.webp`), alt: `ห้องนั่งเล่น ${UNIT_TYPE_LABEL[a.unit_type] ?? a.unit_type}`, ai: true });
  }
  return items;
}

export default function ProjectPage() {
  const { projectId } = useParams();
  const r = useResource(() => getProject(Number(projectId)), [projectId]);

  if (r.state === 'loading') return <div className="mx-auto max-w-5xl animate-pulse px-4 py-8"><div className="aspect-[16/9] rounded-lg bg-slate-100" /></div>;
  if (r.state === 'missing') return <NotFound message="ไม่พบโครงการนี้" />;
  if (r.state === 'error') return <LoadError onRetry={r.retry} />;

  const d = r.data;
  const { project, buildings, amenities } = d;
  const explorer = buildings.some((b) => b.has_explorer);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link to="/search" className="inline-flex items-center gap-1 text-sm text-accent hover:underline"><ArrowLeft className="size-4" aria-hidden />กลับไปผลการค้นหา</Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_340px]">
        <Gallery items={galleryOf(d)} />
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="mt-1 text-slate-600">{project.neighborhood} · {project.district} · {project.province}</p>
          <p className="text-sm text-slate-500">{project.address_display}</p>
          <p className="mt-4 text-xl font-semibold">เริ่มต้น {formatMillion(project.starting_price)}</p>
          <p className="text-sm text-slate-600">{project.total_floors} ชั้น · {project.total_units} ห้อง</p>
          {explorer ? (
            <Link to={`/explorer/${project.id}`} className="mt-5 block rounded-md bg-accent px-5 py-3 text-center text-lg font-medium text-white hover:bg-accent-hover">เลือกห้องจากตัวอาคาร</Link>
          ) : (
            <p className="mt-5 rounded-md bg-slate-100 p-3 text-sm text-slate-600">โครงการนี้ยังไม่เปิดให้เลือกห้องจากตัวอาคาร</p>
          )}
        </div>
      </div>

      <div className="mt-10 space-y-10">
        <section aria-labelledby="desc-h"><h2 id="desc-h" className="text-lg font-semibold">เกี่ยวกับโครงการ</h2><p className="mt-2 text-slate-700">{project.description}</p></section>

        <section aria-labelledby="avail-h"><h2 id="avail-h" className="text-lg font-semibold">ห้องว่าง</h2><div className="mt-2"><Availability rows={d.availability} /></div></section>

        <section aria-label="สิ่งอำนวยความสะดวก">
          <h2 className="text-lg font-semibold">สิ่งอำนวยความสะดวก</h2>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {amenities.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-sm"><AmenityIcon name={a.icon} className="size-5 text-accent" />{a.name}</li>
            ))}
          </ul>
        </section>

        <section aria-label="ข้อมูลอาคาร">
          <h2 className="text-lg font-semibold">ข้อมูลอาคาร</h2>
          <ul className="mt-3 space-y-1 text-sm text-slate-700">
            {buildings.map((b) => (
              <li key={b.id}>{b.name} · ชั้น {b.first_res_floor}–{b.last_res_floor} · {b.unit_bay_widths.length * 2} ห้องต่อชั้น</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
