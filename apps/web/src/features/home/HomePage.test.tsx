import { generate } from '@condoscope/shared';
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

const projects = generate().projects;
const Where = () => { const l = useLocation(); return <output data-testid="where">{l.pathname + l.search}</output>; };
async function openHome() {
  render(<MemoryRouter initialEntries={['/']}><App /><Where /></MemoryRouter>);
  await screen.findByRole('heading', { level: 1 });
}
const where = () => screen.getByTestId('where').textContent!;
const searchQuery = () => new URLSearchParams(where().split('?')[1] ?? '');

describe('HomePage', () => {
  it('follows the order of spec 8.1: hero search, popular areas, featured, all projects, map strip', async () => {
    await openHome();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'ทำเลยอดนิยม', 'โครงการแนะนำ', 'โครงการทั้งหมด', 'สำรวจโครงการบนแผนที่',
    ]);
    expect(screen.getByRole('textbox', { name: 'ชื่อโครงการหรือทำเล' })).toBeInTheDocument();
  });

  it('shows the featured project once in "featured" and every project in "all projects"', async () => {
    await openHome();
    const featured = screen.getByRole('heading', { name: 'โครงการแนะนำ' }).closest('section')!;
    expect(within(featured).getAllByRole('article')).toHaveLength(1);
    const all = screen.getByRole('heading', { name: 'โครงการทั้งหมด' }).closest('section')!;
    expect(within(all).getAllByRole('article')).toHaveLength(projects.length);
  });

  it('has no map and no 3D canvas on the home page', async () => {
    await openHome();
    expect(document.querySelector('canvas')).toBeNull();
  });

  it('searches Thai text', async () => {
    await openHome();
    await userEvent.type(screen.getByRole('textbox', { name: 'ชื่อโครงการหรือทำเล' }), 'อารีย์');
    await userEvent.click(screen.getByRole('button', { name: 'ค้นหา' }));
    expect(where()).toBe('/search?q=%E0%B8%AD%E0%B8%B2%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B9%8C');
  });

  it('puts every chosen filter into the query', async () => {
    await openHome();
    await userEvent.selectOptions(screen.getByLabelText('จังหวัด'), 'นนทบุรี');
    await userEvent.selectOptions(screen.getByLabelText('ราคาสูงสุด'), '5000000');
    await userEvent.selectOptions(screen.getByLabelText('จำนวนห้องนอน'), '1');
    await userEvent.click(screen.getByRole('button', { name: 'ค้นหา' }));
    expect(Object.fromEntries(searchQuery())).toEqual({ province: 'นนทบุรี', maxPrice: '5000000', bedrooms: '1' });
  });

  it('the district list follows the chosen province', async () => {
    await openHome();
    await userEvent.selectOptions(screen.getByLabelText('จังหวัด'), 'นนทบุรี');
    const options = within(screen.getByLabelText('เขต')).getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['ทุกเขต', 'เมืองนนทบุรี']);
  });

  it('an empty form opens the search with no conditions (= all projects)', async () => {
    await openHome();
    await userEvent.click(screen.getByRole('button', { name: 'ค้นหา' }));
    expect(where()).toBe('/search');
  });

  it('special characters survive the round trip through the URL', async () => {
    await openHome();
    const typed = "50% off ' \\ \"; DROP TABLE units;--";
    await userEvent.type(screen.getByRole('textbox', { name: 'ชื่อโครงการหรือทำเล' }), typed);
    await userEvent.click(screen.getByRole('button', { name: 'ค้นหา' }));
    expect(searchQuery().get('q')).toBe(typed);
  });

  it('a popular-area chip searches that area', async () => {
    await openHome();
    await userEvent.click(screen.getByRole('link', { name: 'อ่อนนุช' }));
    expect(searchQuery().get('q')).toBe('อ่อนนุช');
  });

  it('keeps district and minimum price inside a closed "ตัวกรองเพิ่มเติม" section, and still sends them', async () => {
    await openHome();
    const more = screen.getByText('ตัวกรองเพิ่มเติม').closest('details')!;
    expect(more).not.toHaveAttribute('open');
    expect(more).toContainElement(screen.getByLabelText('เขต'));
    expect(more).toContainElement(screen.getByLabelText('ราคาต่ำสุด'));
    expect(more).not.toContainElement(screen.getByLabelText('ราคาสูงสุด'));
    await userEvent.selectOptions(screen.getByLabelText('จังหวัด'), 'นนทบุรี');
    await userEvent.selectOptions(screen.getByLabelText('เขต'), 'เมืองนนทบุรี');
    await userEvent.selectOptions(screen.getByLabelText('ราคาต่ำสุด'), '2000000');
    await userEvent.click(screen.getByRole('button', { name: 'ค้นหา' }));
    expect(Object.fromEntries(searchQuery())).toEqual({ province: 'นนทบุรี', district: 'เมืองนนทบุรี', minPrice: '2000000' });
  });

  it('the hero image is decorative, loaded with priority and the heading is a serif h1', async () => {
    await openHome();
    const hero = screen.getByRole('heading', { level: 1 }).closest('section')!;
    expect(hero.querySelector('img')).toHaveAttribute('alt', '');
    expect(hero.querySelector('img')).toHaveAttribute('fetchpriority', 'high');
  });

  it('shows a retry when the projects cannot be loaded', async () => {
    vi.mocked(searchProjects).mockRejectedValueOnce(new Error('down'));
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);
    expect(await screen.findByRole('alert')).toHaveTextContent('โหลดข้อมูลไม่สำเร็จ');
    await userEvent.click(screen.getByRole('button', { name: 'ลองใหม่' }));
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
