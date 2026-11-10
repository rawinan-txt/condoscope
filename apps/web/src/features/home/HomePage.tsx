import { Map } from 'lucide-react';
import { Link } from 'react-router';
import { LoadError } from '../../components/NotFound';
import ProjectCard from '../../components/ProjectCard';
import { useResource } from '../../hooks/useResource';
import { searchProjects } from '../../services/api';
import Hero from './Hero';

export default function HomePage() {
  const r = useResource(() => searchProjects({ limit: 50 }), []);

  if (r.state === 'loading') return <div className="mx-auto max-w-5xl animate-pulse px-4 py-8"><div className="h-72 rounded-lg bg-slate-100" /></div>;
  if (r.state !== 'ok') return <LoadError onRetry={r.state === 'error' ? r.retry : () => location.reload()} />;

  const projects = r.data.items;
  const areas = [...new Set(projects.map((p) => p.neighborhood))];
  const featured = projects.filter((p) => p.is_featured);

  return (
    <>
      <Hero projects={projects} />
      <div className="mx-auto max-w-5xl space-y-12 px-4 py-10">
        <section aria-labelledby="areas-h">
          <h2 id="areas-h" className="text-lg font-semibold">ทำเลยอดนิยม</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {areas.map((a) => (
              <li key={a}>
                <Link to={{ pathname: '/search', search: `?${new URLSearchParams({ q: a })}` }} className="inline-block rounded-full border border-slate-300 px-4 py-1.5 text-sm hover:border-accent hover:text-accent">{a}</Link>
              </li>
            ))}
          </ul>
        </section>

        {featured.length > 0 && (
          <section aria-labelledby="featured-h">
            <h2 id="featured-h" className="text-lg font-semibold">โครงการแนะนำ</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{featured.map((p) => <ProjectCard key={p.id} project={p} />)}</div>
          </section>
        )}

        <section aria-labelledby="all-h">
          <h2 id="all-h" className="text-lg font-semibold">โครงการทั้งหมด</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projects.map((p) => <ProjectCard key={p.id} project={p} />)}</div>
        </section>

        <section aria-labelledby="map-h" className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-6">
          <div>
            <h2 id="map-h" className="text-lg font-semibold">สำรวจโครงการบนแผนที่</h2>
            <p className="mt-1 text-sm text-slate-600">ดูว่าแต่ละโครงการอยู่ตรงไหนของกรุงเทพฯ และปริมณฑล</p>
          </div>
          <Link to="/map" className="inline-flex items-center gap-2 rounded-md border border-accent px-4 py-2 text-accent hover:bg-blue-50">
            <Map className="size-4" aria-hidden />เปิดแผนที่
          </Link>
        </section>
      </div>
    </>
  );
}
