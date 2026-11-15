import { lazy, Suspense } from 'react';
import { useSeenIntro } from '../../lib/intro';
import HomePage from './HomePage';

// The intro is a separate chunk: returning visitors never download it.
const Intro = lazy(() => import('../story/Intro'));

/** While the intro chunk loads: the first still of the intro, so the first screen is a picture at once. */
function IntroFallback() {
  return (
    <div className="relative h-svh overflow-hidden bg-ink">
      <img src={`${import.meta.env.BASE_URL}images/story/still-1.webp`} alt="" fetchPriority="high" className="h-full w-full object-cover" />
    </div>
  );
}

export function IntroPage() {
  return <Suspense fallback={<IntroFallback />}><Intro /></Suspense>;
}

/** "/" : the intro for a first-time visitor, the home page (search box, projects) for everybody who has seen it. */
export default function HomeGate() {
  return useSeenIntro() ? <HomePage /> : <IntroPage />;
}
