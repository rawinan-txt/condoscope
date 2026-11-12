import type { Project } from '@condoscope/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HeroImage, { heroSrc, projectHero } from './HeroImage';

const project = { id: 1, name: 'Noventa Ari', thumbnail_url: 'images/projects/noventa-ari.jpg' } as Project;

describe('heroSrc', () => {
  it('derives the big image names from the thumbnail name', () => {
    expect(heroSrc('images/projects/noventa-ari.jpg')).toEqual({ src: 'images/projects/noventa-ari-hero.webp', srcSm: 'images/projects/noventa-ari-hero-sm.webp' });
  });
});

describe('HeroImage', () => {
  const img = () => document.querySelector('img');

  it('shows the big image with the AI badge, high priority and no lazy loading', () => {
    render(<HeroImage {...projectHero(project)!} priority />);
    expect(img()!.getAttribute('src')).toContain('noventa-ari-hero.webp');
    expect(img()).toHaveAttribute('fetchpriority', 'high');
    expect(img()).not.toHaveAttribute('loading', 'lazy');
    expect(screen.getByText('ภาพประกอบสร้างด้วย AI')).toBeInTheDocument();
  });

  it('falls back to the old thumbnail (no AI badge), then to nothing, never a broken image', () => {
    render(<HeroImage {...projectHero(project)!} />);
    fireEvent.error(img()!);
    expect(img()!.getAttribute('src')).toContain('noventa-ari.jpg');
    expect(screen.queryByText('ภาพประกอบสร้างด้วย AI')).toBeNull();
    fireEvent.error(img()!);
    expect(img()).toBeNull();
  });

  it('projectHero is null for a project without an image', () => {
    expect(projectHero({ ...project, thumbnail_url: null })).toBeNull();
  });

  it('without a fallback a missing big image leaves nothing (no broken image)', () => {
    render(<HeroImage src="images/home-hero.webp" srcSm="images/home-hero-sm.webp" />);
    expect(img()!.getAttribute('srcset')).toContain('home-hero-sm.webp 960w');
    fireEvent.error(img()!);
    expect(img()).toBeNull();
  });
});
