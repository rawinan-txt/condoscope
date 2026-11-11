import type { Project } from '@condoscope/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HeroImage, { heroSrc } from './HeroImage';

const project = { id: 1, name: 'Noventa Ari', thumbnail_url: 'images/projects/noventa-ari.jpg' } as Project;

describe('heroSrc', () => {
  it('derives the big image names from the thumbnail name', () => {
    expect(heroSrc('images/projects/noventa-ari.jpg')).toEqual({ src: 'images/projects/noventa-ari-hero.webp', srcSm: 'images/projects/noventa-ari-hero-sm.webp' });
  });
});

describe('HeroImage', () => {
  const img = () => document.querySelector('img');

  it('shows the big image with the AI badge, high priority and no lazy loading', () => {
    render(<HeroImage project={project} priority />);
    expect(img()!.getAttribute('src')).toContain('noventa-ari-hero.webp');
    expect(img()).toHaveAttribute('fetchpriority', 'high');
    expect(img()).not.toHaveAttribute('loading', 'lazy');
    expect(screen.getByText('ภาพประกอบสร้างด้วย AI')).toBeInTheDocument();
  });

  it('falls back to the old thumbnail (no AI badge), then to nothing, never a broken image', () => {
    render(<HeroImage project={project} />);
    fireEvent.error(img()!);
    expect(img()!.getAttribute('src')).toContain('noventa-ari.jpg');
    expect(screen.queryByText('ภาพประกอบสร้างด้วย AI')).toBeNull();
    fireEvent.error(img()!);
    expect(img()).toBeNull();
  });

  it('renders nothing for a project without an image', () => {
    render(<HeroImage project={{ ...project, thumbnail_url: null }} />);
    expect(img()).toBeNull();
  });
});
