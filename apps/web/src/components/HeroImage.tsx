import type { Project } from '@condoscope/shared';
import { useState } from 'react';
import AiBadge from './AiBadge';

/** Big images are found by name, so no database column or re-seed is needed: `x.jpg` -> `x-hero.webp` (1376 wide, the native size of the supplied images) and `x-hero-sm.webp` (960 wide). */
export const heroSrc = (thumbnailUrl: string) => ({
  src: thumbnailUrl.replace(/\.jpg$/, '-hero.webp'),
  srcSm: thumbnailUrl.replace(/\.jpg$/, '-hero-sm.webp'),
});

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

/** Decorative full-bleed project image. Missing big image -> old 3D thumbnail -> nothing (the dark page colour stays). Only the big (AI) image carries the AI badge. */
export default function HeroImage({ project, priority = false, className = '' }: { project: Project; priority?: boolean; className?: string }) {
  const [stage, setStage] = useState<'hero' | 'thumb' | 'none'>('hero');
  const thumb = project.thumbnail_url;
  if (!thumb || stage === 'none') return null;
  const big = heroSrc(thumb);
  const common = { alt: '', className: `h-full w-full object-cover ${className}`, onError: () => setStage((s) => (s === 'hero' ? 'thumb' : 'none')) };
  return (
    <>
      {stage === 'hero' ? (
        <img {...common} src={asset(big.src)} srcSet={`${asset(big.srcSm)} 960w, ${asset(big.src)} 1376w`} sizes="100vw" {...(priority ? { fetchPriority: 'high' as const } : { loading: 'lazy' as const })} />
      ) : (
        <img {...common} src={asset(thumb)} />
      )}
      {stage === 'hero' && <AiBadge />}
    </>
  );
}
