import type { Project } from '@condoscope/shared';
import { useState } from 'react';
import AiBadge from './AiBadge';

/** Big images are found by name, so no database column or re-seed is needed: `x.jpg` -> `x-hero.webp` (1376 wide, the native size of the supplied images) and `x-hero-sm.webp` (960 wide). */
export const heroSrc = (thumbnailUrl: string) => ({
  src: thumbnailUrl.replace(/\.jpg$/, '-hero.webp'),
  srcSm: thumbnailUrl.replace(/\.jpg$/, '-hero-sm.webp'),
});

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const projectHero = (p: Project) => (p.thumbnail_url ? { ...heroSrc(p.thumbnail_url), fallback: p.thumbnail_url } : null);

/** Decorative full-bleed image. Missing big image -> `fallback` (the old 3D thumbnail, no AI badge) -> nothing (the dark page colour stays). Only the big (AI) image carries the AI badge. */
export default function HeroImage({ src, srcSm, fallback, priority = false, className = '' }: { src: string; srcSm: string; fallback?: string; priority?: boolean; className?: string }) {
  const [stage, setStage] = useState<'hero' | 'thumb' | 'none'>('hero');
  if (stage === 'none') return null;
  const common = { alt: '', className: `h-full w-full object-cover ${className}`, onError: () => setStage((s) => (s === 'hero' && fallback ? 'thumb' : 'none')) };
  return (
    <>
      {stage === 'hero' ? (
        <img {...common} src={asset(src)} srcSet={`${asset(srcSm)} 960w, ${asset(src)} 1376w`} sizes="100vw" {...(priority ? { fetchPriority: 'high' as const } : { loading: 'lazy' as const })} />
      ) : (
        <img {...common} src={asset(fallback!)} />
      )}
      {stage === 'hero' && <AiBadge />}
    </>
  );
}
