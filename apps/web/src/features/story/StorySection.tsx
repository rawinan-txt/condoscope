import type { Project } from '@condoscope/shared';
import { lazy, Suspense, useRef } from 'react';
import { useNear } from './useNear';

// Everything heavy sits behind this import, so the home page itself only carries this small loader.
const StoryBody = lazy(() => import('./StoryBody'));

/**
 * Story under the search box: the featured tower told as the page scrolls. It sits below the first screen (spec 8.1), loads nothing
 * until it is near and the browser is idle, and shows nothing at all when the project has no free unit.
 */
export default function StorySection({ project }: { project: Project }) {
  const ref = useRef<HTMLElement>(null);
  const near = useNear(ref);
  return (
    <>
      <section ref={ref} aria-label={`เรื่องเล่า ${project.name}`} className="bg-ink text-white">
        {near && <Suspense fallback={<div className="h-svh" aria-hidden />}><StoryBody project={project} /></Suspense>}
      </section>
      <div id="story-end" tabIndex={-1} className="outline-none" />
    </>
  );
}

