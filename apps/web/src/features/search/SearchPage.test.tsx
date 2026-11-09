import { generate, searchProjectsLocal } from '@condoscope/shared';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { searchProjects } from '../../services/api';

vi.mock('../../services/api', async (importOriginal) => {
  const m = await importOriginal<typeof import('../../services/api')>();
  return { ...m, searchProjects: vi.fn(m.searchProjects) };
});

const d = generate();
const Where = () => { const l = useLocation(); return <output data-testid="where">{l.pathname + l.search}</output>; };
async function open(url: string) {
  render(<MemoryRouter initialEntries={[url]}><App /><Where /></MemoryRouter>);
  await screen.findByRole('heading', { level: 1, name: 'ค้นหาคอนโด' });
}
const where = () => screen.getByTestId('where').textContent!;
const cards = () => screen.queryAllByRole('article');
const names = () => cards().map((c) => within(c).getByRole('heading').textContent);

describe('SearchPage', () => {
  it('without conditions lists every project and the count', async () => {
    await open('/search');
    expect(await screen.findAllByRole('article')).toHaveLength(5);
    expect(screen.getByText('พบ 5 โครงการ')).toBeInTheDocument();
  });

  it('a messy URL is cleaned instead of failing (Review Focus 1)', async () => {
    await open('/search?minPrice=abc&limit=999&bedrooms=9&sort=x&foo=bar');
    expect(await screen.findAllByRole('article')).toHaveLength(5);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('a 500-character q and a reversed price range give a normal empty result, not an error page', async () => {
    await open(`/search?q=${'x'.repeat(500)}&maxPrice=1&minPrice=5`);
    expect(await screen.findByText('ไม่พบโครงการที่ตรงเงื่อนไข')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'ไม่พบข้อมูล' })).toBeNull();
  });

  it('choosing a filter writes it to the URL and narrows the results', async () => {
    await open('/search');
    await screen.findAllByRole('article');
    await userEvent.selectOptions(screen.getByLabelText('จังหวัด'), 'นนทบุรี');
    expect(new URLSearchParams(where().split('?')[1]).get('province')).toBe('นนทบุรี');
    expect(await screen.findByText('พบ 1 โครงการ')).toBeInTheDocument();
    expect(names()).toEqual(['Kaelo Khae Rai']);
  });

  it('typed text is applied on Enter', async () => {
    await open('/search');
    await screen.findAllByRole('article');
    await userEvent.type(screen.getByRole('textbox', { name: 'ชื่อโครงการหรือทำเล' }), 'อารีย์{Enter}');
    expect(new URLSearchParams(where().split('?')[1]).get('q')).toBe('อารีย์');
    expect(await screen.findByText('พบ 1 โครงการ')).toBeInTheDocument();
  });

  it('sorting orders the cards like the shared search rules', async () => {
    await open('/search');
    await screen.findAllByRole('article');
    await userEvent.selectOptions(screen.getByLabelText('เรียงตาม'), 'price_desc');
    const expected = searchProjectsLocal(d, { sort: 'price_desc' }).items.map((p) => p.name);
    await vi.waitFor(() => expect(names()).toEqual(expected));
  });

  it('shows the empty state and "clear filters" brings every project back', async () => {
    await open('/search?q=zzzz');
    expect(await screen.findByText('ไม่พบโครงการที่ตรงเงื่อนไข')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'ล้างตัวกรอง' })[0]);
    expect(where()).toBe('/search');
    expect(await screen.findAllByRole('article')).toHaveLength(5);
  });

  it('"view on map" keeps the filters but not sort, limit or offset', async () => {
    await open('/search?q=ari&province=%E0%B8%81%E0%B8%A3%E0%B8%B8%E0%B8%87%E0%B9%80%E0%B8%97%E0%B8%9E%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%99%E0%B8%84%E0%B8%A3&sort=newest&limit=2&offset=1');
    const link = await screen.findByRole('link', { name: 'ดูบนแผนที่' });
    const href = new URL(link.getAttribute('href')!, 'http://x');
    expect(href.pathname).toBe('/map');
    expect(Object.fromEntries(href.searchParams)).toEqual({ q: 'ari', province: 'กรุงเทพมหานคร' });
  });

  it('the filter panel can be opened and closed on small screens', async () => {
    await open('/search');
    const button = screen.getByRole('button', { name: /^ตัวกรอง/ });
    const panel = document.getElementById(button.getAttribute('aria-controls')!)!;
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(panel.className).toContain('hidden');
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(panel.className).not.toContain('hidden');
  });

  it('the filter button shows how many filters are active', async () => {
    await open('/search?q=ari&bedrooms=1');
    expect(screen.getByRole('button', { name: 'ตัวกรอง (2)' })).toBeInTheDocument();
  });

  it('a failing search shows the retry state, not "not found"', async () => {
    const original = vi.mocked(searchProjects).getMockImplementation()!;
    vi.mocked(searchProjects).mockRejectedValue(new Error('down'));
    try {
      render(<MemoryRouter initialEntries={['/search']}><App /></MemoryRouter>);
      expect(await screen.findByRole('alert')).toHaveTextContent('โหลดข้อมูลไม่สำเร็จ');
      expect(screen.queryByRole('heading', { name: 'ไม่พบข้อมูล' })).toBeNull();
    } finally {
      vi.mocked(searchProjects).mockImplementation(original);
    }
  });
});
