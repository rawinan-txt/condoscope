import type { Project } from '@condoscope/shared';
import { useState } from 'react';
import HeroImage, { projectHero } from '../../components/HeroImage';
import { stillOpacities } from './stills';

const base = import.meta.env.BASE_URL;

/** Four pictures of the 3D scene cross-fading with the scroll. A missing picture falls back to the hero image of the project. Decorative: the text carries the story. */
export default function StoryStills({ p, project }: { p: number; project: Project }) {
  const [broken, setBroken] = useState(false);
  const hero = projectHero(project);
  if (broken) return hero ? <HeroImage {...hero} /> : null;
  const o = stillOpacities(p);
  return (
    <>
      {o.map((opacity, i) => (
        <img key={i} src={`${base}images/story/still-${i + 1}.webp`} alt="" onError={() => setBroken(true)} loading={i === 0 ? 'eager' : 'lazy'}
          className="absolute inset-0 h-full w-full object-cover" style={{ opacity }} />
      ))}
    </>
  );
}
