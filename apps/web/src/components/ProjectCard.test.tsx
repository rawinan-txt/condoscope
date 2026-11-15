import { formatMillion, generate } from '@condoscope/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProjectCard from './ProjectCard';

const [noventa, selvara] = generate().projects;
const show = (p: typeof noventa) => render(<MemoryRouter><ProjectCard project={p} /></MemoryRouter>);

describe('ProjectCard', () => {
  it('shows name, location, price and basic facts', () => {
    show(noventa);
    expect(screen.getByRole('heading', { name: 'Noventa Ari' })).toBeInTheDocument();
    expect(screen.getByText(`${noventa.neighborhood} · ${noventa.province}`)).toBeInTheDocument();
    expect(screen.getByText(`เริ่มต้น ${formatMillion(noventa.starting_price)}`)).toBeInTheDocument();
    expect(screen.getByText(`${noventa.total_floors} ชั้น · ${noventa.total_units} ห้อง`)).toBeInTheDocument();
  });

  it('has exactly one link, to the project page', () => {
    show(noventa);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/project/1');
    expect(links[0]).toHaveTextContent('ดูรายละเอียด');
  });

  it('shows the small AI hero picture from under the site base path, lazily, with the AI label; the old thumbnail is the fallback', () => {
    show(noventa);
    const img = screen.getByRole('img', { name: 'ภาพโครงการ Noventa Ari' });
    expect(img.getAttribute('src')).toBe(`${import.meta.env.BASE_URL}images/projects/noventa-ari-hero-sm.webp`);
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(screen.getByText('ภาพประกอบสร้างด้วย AI')).toBeInTheDocument();
    fireEvent.error(img);
    expect(screen.getByRole('img', { name: 'ภาพโครงการ Noventa Ari' }).getAttribute('src')).toBe(`${import.meta.env.BASE_URL}images/projects/noventa-ari.jpg`);
    expect(screen.queryByText('ภาพประกอบสร้างด้วย AI')).toBeNull();
  });

  it('is borderless, with a serif name and a text link (no button box)', () => {
    show(noventa);
    expect(screen.getByRole('article')).not.toHaveClass('border');
    expect(screen.getByRole('heading', { name: 'Noventa Ari' })).toHaveClass('font-serif');
    expect(screen.getByRole('link')).toHaveClass('underline');
    expect(screen.getByRole('link')).not.toHaveClass('bg-accent');
  });

  it('marks only the featured project', () => {
    const { unmount } = show(noventa);
    expect(screen.getByText('แนะนำ')).toBeInTheDocument();
    unmount();
    show(selvara);
    expect(screen.queryByText('แนะนำ')).toBeNull();
  });

  it('without a thumbnail shows a plain box with a note instead of a broken image', () => {
    show({ ...noventa, thumbnail_url: null });
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('ยังไม่มีภาพโครงการ')).toBeInTheDocument();
  });

  describe('view transition to the project page', () => {
    const reduce = (on: boolean) => vi.stubGlobal('matchMedia', (q: string) => ({ matches: on && q.includes('reduce'), addEventListener() {}, removeEventListener() {} }));
    let named = -1;
    const arrange = () => {
      const start = vi.fn((cb: () => void) => { named = document.querySelectorAll('[style*="view-transition-name"]').length; cb(); return { finished: Promise.resolve(), ready: Promise.resolve(), updateCallbackDone: Promise.resolve(), skipTransition() {} }; });
      (document as unknown as { startViewTransition: unknown }).startViewTransition = start;
      render(<MemoryRouter><Routes><Route path="/" element={<><ProjectCard project={noventa} /><ProjectCard project={selvara} /></>} /><Route path="/project/:id" element={<p>project page</p>} /></Routes></MemoryRouter>);
      return start;
    };
    afterEach(() => { vi.unstubAllGlobals(); delete (document as unknown as { startViewTransition?: unknown }).startViewTransition; });

    it('starts one when motion is allowed', async () => {
      reduce(false);
      const start = arrange();
      await userEvent.click(screen.getAllByRole('link', { name: 'ดูรายละเอียด' })[0]);
      expect(start).toHaveBeenCalledTimes(1);
      expect(named).toBe(1); // only the opened card's picture carries the name
      expect(await screen.findByText('project page')).toBeInTheDocument();
    });

    it('does not start one when the person asked for reduced motion, and still navigates', async () => {
      reduce(true);
      const start = arrange();
      await userEvent.click(screen.getAllByRole('link', { name: 'ดูรายละเอียด' })[0]);
      expect(start).not.toHaveBeenCalled();
      expect(await screen.findByText('project page')).toBeInTheDocument();
    });

    it('names no picture before a click, so no two cards share a transition name', () => {
      reduce(false);
      arrange();
      for (const img of screen.getAllByRole('img')) expect(img.style.viewTransitionName ?? '').toBe('');
    });
  });
});
