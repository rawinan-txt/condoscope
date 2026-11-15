import { useState } from 'react';
import { stillOpacities } from './stills';

const base = import.meta.env.BASE_URL;

/**
 * Four pictures of the 3D scene cross-fading with the scroll. The first one is the first screen of the whole site, so it loads at once
 * with high priority; the others wait. A missing picture falls back to the plain hero image. Decorative: the text carries the story.
 */
export default function StoryStills({ p, fallback }: { p: number; fallback?: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return fallback ? <img src={`${base}${fallback}`} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null;
  return (
    <>
      {stillOpacities(p).map((opacity, i) => (
        <img
          key={i}
          src={`${base}images/story/still-${i + 1}.webp`}
          srcSet={`${base}images/story/still-${i + 1}-sm.webp 720w, ${base}images/story/still-${i + 1}.webp 1376w`}
          sizes="100vw"
          alt=""
          {...(i === 0 ? { fetchPriority: 'high' as const } : { loading: 'lazy' as const })}
          onError={() => setBroken(true)}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity }}
        />
      ))}
    </>
  );
}
