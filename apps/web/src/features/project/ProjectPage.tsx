import { formatMillion, imageFile, UNIT_TYPE_LABEL, type ProjectDetailPayload } from '@condoscope/shared';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import AmenityIcon from '../../components/AmenityIcon';
import HeroImage, { projectHero } from '../../components/HeroImage';
import { scrimBackground } from '../../components/theme';
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

  if (r.state === 'loading') return <div className="mx-auto max-w-5xl animate-pulse px-4 py-8"><div className="aspect-[16/9] rounded-lg bg-ink/5" /></div>;
  if (r.state === 'missing') return <NotFound message="ไม่พบโครงการนี้" />;
  if (r.state === 'error') return <LoadError onRetry={r.retry} />;

  const d = r.data;
  const { project, buildings, amenities } = d;
  const explorer = buildings.some((b) => b.has_explorer);
  const hero = projectHero(project);

  return (
    <div>
      <header className="relative isolate flex min-h-[60svh] items-end overflow-hidden bg-ink">
        {hero && <div className="absolute inset-0 -z-20 overflow-hidden"><HeroImage {...hero} priority className="hero-settle" /></div>}
        <div className="absolute inset-0 -z-10" style={{ background: scrimBackground }} aria-hidden />
        <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-24">
          <Link to="/search" className="inline-flex items-center gap-1 text-sm text-white underline underline-offset-4"><ArrowLeft className="size-4" aria-hidden />กลับไปผลการค้นหา</Link>
          <h1 className="mt-4 text-4xl text-white md:text-6xl">{project.name}</h1>
          <p className="mt-2 text-lg text-white">{project.neighborhood} · {project.district} · {project.province}</p>
          <p className="text-sm text-white">{project.address_display}</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-x-12 gap-y-10 px-4 py-12 lg:grid-cols-[1fr_340px]">
        <aside className="lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 lg:self-start">
          <p className="font-serif text-3xl">เริ่มต้น {formatMillion(project.starting_price)}</p>
          <p className="mt-1 text-sm text-stone">{project.total_floors} ชั้น · {project.total_units} ห้อง</p>
          {explorer ? (
            <Link to={`/explorer/${project.id}`} className="mt-6 block bg-champagne px-5 py-3 text-center text-lg font-medium text-ink hover:bg-champagne-soft">เลือกห้องจากตัวอาคาร</Link>
          ) : (
            <p className="mt-6 bg-ink/5 p-3 text-sm text-stone">โครงการนี้ยังไม่เปิดให้เลือกห้องจากตัวอาคาร</p>
          )}
        </aside>

        <div className="space-y-14 lg:col-start-1 lg:row-start-1">
          <Gallery items={galleryOf(d)} />

          <section aria-labelledby="desc-h"><h2 id="desc-h" className="font-serif text-2xl">เกี่ยวกับโครงการ</h2><p className="mt-3 text-lg leading-relaxed">{project.description}</p></section>

          <section aria-labelledby="avail-h"><h2 id="avail-h" className="font-serif text-2xl">ห้องว่าง</h2><div className="mt-3"><Availability rows={d.availability} /></div></section>

          <section aria-label="สิ่งอำนวยความสะดวก">
            <h2 className="font-serif text-2xl">สิ่งอำนวยความสะดวก</h2>
            <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {amenities.map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-sm"><AmenityIcon name={a.icon} className="size-5 text-bronze" />{a.name}</li>
              ))}
            </ul>
          </section>

          <section aria-label="ข้อมูลอาคาร">
            <h2 className="font-serif text-2xl">ข้อมูลอาคาร</h2>
            <ul className="mt-3 space-y-1 text-sm text-stone">
              {buildings.map((b) => (
                <li key={b.id}>{b.name} · ชั้น {b.first_res_floor}–{b.last_res_floor} · {b.unit_bay_widths.length * 2} ห้องต่อชั้น</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
