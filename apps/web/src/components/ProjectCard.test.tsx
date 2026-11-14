import { formatMillion, generate } from '@condoscope/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
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

  it('loads the thumbnail lazily from under the site base path', () => {
    show(noventa);
    const img = screen.getByRole('img', { name: 'ภาพโครงการ Noventa Ari' });
    expect(img.getAttribute('src')).toBe(`${import.meta.env.BASE_URL}images/projects/noventa-ari.jpg`);
    expect(img).toHaveAttribute('loading', 'lazy');
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
});
