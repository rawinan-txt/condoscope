import { Map } from 'lucide-react';
import { Link } from 'react-router';
import { LoadError } from '../../components/NotFound';
import ProjectCard from '../../components/ProjectCard';
import { useResource } from '../../hooks/useResource';
import { useReveal } from '../../hooks/useReveal';
import { searchProjects } from '../../services/api';
import Hero from './Hero';

export default function HomePage() {
  const r = useResource(() => searchProjects({ limit: 50 }), []);

  if (r.state === 'loading') return <div className="mx-auto max-w-5xl animate-pulse px-4 py-8"><div className="h-72 rounded-lg bg-ink/10" /></div>;
  if (r.state !== 'ok') return <LoadError onRetry={r.state === 'error' ? r.retry : () => location.reload()} />;

  const projects = r.data.items;
  const areas = [...new Set(projects.map((p) => p.neighborhood))];
  const featured = projects.filter((p) => p.is_featured);

  return (
    <>
      <Hero projects={projects} />
      <div className="mx-auto max-w-6xl space-y-24 px-4 py-20">
        <Section id="areas-h" title="ทำเลยอดนิยม">
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {areas.map((a) => (
              <li key={a}>
                <Link to={{ pathname: '/search', search: `?${new URLSearchParams({ q: a })}` }} className="font-serif text-xl text-ink underline decoration-champagne decoration-2 underline-offset-8 hover:text-bronze">{a}</Link>
              </li>
            ))}
          </ul>
        </Section>

        {featured.length > 0 && (
          <Section id="featured-h" title="โครงการแนะนำ">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">{featured.map((p) => <ProjectCard key={p.id} project={p} />)}</div>
          </Section>
        )}

        <Section id="all-h" title="โครงการทั้งหมด">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">{projects.map((p) => <ProjectCard key={p.id} project={p} />)}</div>
        </Section>

        <section aria-labelledby="map-h" className="flex flex-wrap items-center justify-between gap-6 border-t border-champagne pt-10">
          <div>
            <h2 id="map-h" className="font-serif text-2xl">สำรวจโครงการบนแผนที่</h2>
            <p className="mt-2 text-stone">ดูว่าแต่ละโครงการอยู่ตรงไหนของกรุงเทพฯ และปริมณฑล</p>
          </div>
          <Link to="/map" className="inline-flex items-center gap-2 bg-ink px-6 py-3 text-ivory hover:bg-accent-hover">
            <Map className="size-4" aria-hidden />เปิดแผนที่
          </Link>
        </section>
      </div>
    </>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} aria-labelledby={id} className="reveal">
      <h2 id={id} className="font-serif text-3xl">{title}</h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}
