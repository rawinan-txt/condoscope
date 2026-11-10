import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { searchProjects } from '../../services/api';

// The real map needs WebGL, which jsdom does not have; it is covered by the Playwright tests instead.
vi.mock('./MapView', () => ({
  default: ({ projects, onUnavailable }: { projects: unknown[]; onUnavailable(r: 'style' | 'webgl'): void }) => (
    <div data-testid="map-view" data-count={projects.length}><button onClick={() => onUnavailable('style')}>simulate-map-failure</button></div>
  ),
}));
vi.mock('../../services/api', async (importOriginal) => {
  const m = await importOriginal<typeof import('../../services/api')>();
  return { ...m, searchProjects: vi.fn(m.searchProjects) };
});

const open = (url = '/map') => render(<MemoryRouter initialEntries={[url]}><App /></MemoryRouter>);
const list = () => screen.getByRole('list', { name: 'รายการโครงการ' });

describe('MapPage', () => {
  it('shows the map and a list with every project', async () => {
    open();
    expect((await screen.findByTestId('map-view')).dataset.count).toBe('5');
    expect(within(list()).getAllByRole('listitem')).toHaveLength(5);
  });

  it('applies the filters carried in the URL to both the list and the map', async () => {
    open(`/map?province=${encodeURIComponent('นนทบุรี')}`);
    expect((await screen.findByTestId('map-view')).dataset.count).toBe('1');
    expect(within(list()).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('พบ 1 โครงการ')).toBeInTheDocument();
  });

  it('cleans a messy URL instead of failing', async () => {
    open('/map?minPrice=abc&limit=999&bedrooms=9&sort=x');
    expect((await screen.findByTestId('map-view')).dataset.count).toBe('5');
  });

  it('each list item links to the project page', async () => {
    open();
    await screen.findByTestId('map-view');
    const first = within(within(list()).getAllByRole('listitem')[0]).getByRole('link');
    expect(first).toHaveAttribute('href', '/project/1');
  });

  it('switches between map and list on small screens', async () => {
    open();
    await screen.findByTestId('map-view');
    const mapButton = screen.getByRole('button', { name: 'แผนที่' });
    const listButton = screen.getByRole('button', { name: 'รายการ' });
    expect(mapButton).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(listButton);
    expect(listButton).toHaveAttribute('aria-pressed', 'true');
    expect(mapButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('when the map cannot be used it says so and keeps the list (Review Focus 2)', async () => {
    open();
    await userEvent.click(await screen.findByRole('button', { name: 'simulate-map-failure' }));
    const notice = screen.getByText('แผนที่โหลดไม่ได้ กำลังแสดงเป็นรายการแทน');
    expect(notice).toHaveAttribute('role', 'status');
    expect(screen.queryByTestId('map-view')).toBeNull();
    expect(within(list()).getAllByRole('listitem')).toHaveLength(5);
  });

  it('always shows the OpenFreeMap / OpenMapTiles / OpenStreetMap credit with links', async () => {
    open();
    await screen.findByTestId('map-view');
    const credit = screen.getByText(/แผนที่:/).closest('p')!;
    expect(within(credit).getByRole('link', { name: 'OpenFreeMap' })).toHaveAttribute('href', 'https://openfreemap.org');
    expect(within(credit).getByRole('link', { name: 'OpenMapTiles' })).toHaveAttribute('href', 'https://www.openmaptiles.org/');
    expect(within(credit).getByRole('link', { name: 'OpenStreetMap' })).toHaveAttribute('href', 'https://www.openstreetmap.org/copyright');
  });

  it('keeps the credit visible even when the map failed', async () => {
    open();
    await userEvent.click(await screen.findByRole('button', { name: 'simulate-map-failure' }));
    expect(screen.getByText(/แผนที่:/)).toBeInTheDocument();
  });

  it('shows the retry state when the projects cannot be loaded', async () => {
    const original = vi.mocked(searchProjects).getMockImplementation()!;
    vi.mocked(searchProjects).mockRejectedValue(new Error('down'));
    try {
      open();
      expect(await screen.findByRole('alert')).toHaveTextContent('โหลดข้อมูลไม่สำเร็จ');
    } finally {
      vi.mocked(searchProjects).mockImplementation(original);
    }
  });
});
