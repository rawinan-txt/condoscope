import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';

const at = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

describe('ExplorerPage', () => {
  beforeEach(() => { try { sessionStorage.clear(); } catch { /* ignore */ } });

  it('shows not-found for an unknown project', async () => {
    at('/explorer/999999');
    expect(await screen.findByRole('heading', { name: 'ไม่พบข้อมูล' })).toBeInTheDocument();
  });

  it('opens the details panel for a unit picked from the list', async () => {
    at('/explorer/1');
    await userEvent.click(within(await screen.findByRole('table')).getByRole('button', { name: /^ห้อง A-1805 / }));
    const panel = screen.getByRole('region', { name: 'รายละเอียดห้อง' });
    expect(within(panel).getByRole('heading', { name: 'ห้อง A-1805' })).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: 'ดูรายละเอียดห้อง' }).getAttribute('href')).toMatch(/\/unit\/\d+$/);
  });

  it('preselects the unit given in ?unit=', async () => {
    at('/explorer/1?unit=1');
    const panel = await screen.findByRole('region', { name: 'รายละเอียดห้อง' });
    expect(within(panel).getByRole('heading', { name: 'ห้อง A-701' })).toBeInTheDocument();
  });

  it('shows a legend with a text label for every status', async () => {
    at('/explorer/1');
    const legend = await screen.findByRole('list', { name: 'สถานะห้อง' });
    for (const label of ['ว่าง', 'จองแล้ว', 'ขายแล้ว', 'ไม่เปิดขาย', 'คุณจอง (Demo)']) expect(within(legend).getByText(label)).toBeInTheDocument();
  });

  it('has a link back to the project page', async () => {
    at('/explorer/1');
    expect(await screen.findByRole('link', { name: /กลับหน้าโครงการ/ })).toHaveAttribute('href', '/project/1');
    expect(screen.getByRole('heading', { level: 1, name: 'Noventa Ari' })).toBeInTheDocument();
  });

  describe('side panels', () => {
    it('are tabs: rooms, filters and floors, one visible at a time', async () => {
      at('/explorer/1');
      const tabs = await screen.findAllByRole('tab');
      expect(tabs.map((t) => t.textContent)).toEqual(['ห้อง', 'ตัวกรอง', 'ชั้น']);
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', tabs[0].id);

      await userEvent.click(tabs[1]);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(screen.getByLabelText('ราคาสูงสุด')).toBeInTheDocument();
      await userEvent.click(tabs[2]);
      expect(screen.getByLabelText('ดูทีละชั้น')).toBeInTheDocument();
    });

    it('move between tabs with the arrow keys (roving tabindex)', async () => {
      at('/explorer/1');
      const [rooms, filters, floors] = await screen.findAllByRole('tab');
      expect(rooms).toHaveAttribute('tabindex', '0');
      expect(filters).toHaveAttribute('tabindex', '-1');
      rooms.focus();
      await userEvent.keyboard('{ArrowRight}');
      expect(filters).toHaveFocus();
      expect(filters).toHaveAttribute('aria-selected', 'true');
      await userEvent.keyboard('{End}');
      expect(floors).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      expect(rooms).toHaveFocus();
    });

    it('can be hidden and shown again; the choice is remembered for the session', async () => {
      at('/explorer/1');
      const btn = await screen.findByRole('button', { name: /ซ่อนแผง/ });
      expect(btn).toHaveAttribute('aria-expanded', 'true');
      await userEvent.click(btn);
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      const show = screen.getByRole('button', { name: /แสดงแผง/ });
      expect(show).toHaveAttribute('aria-expanded', 'false');
      expect(sessionStorage.getItem('condoscope.explorer.panel')).toBe('0');
      await userEvent.click(show);
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('start hidden when the session says so', async () => {
      sessionStorage.setItem('condoscope.explorer.panel', '0');
      at('/explorer/1');
      expect(await screen.findByRole('button', { name: /แสดงแผง/ })).toBeInTheDocument();
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });

    it('still work when browser storage is blocked', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
      at('/explorer/1');
      await userEvent.click(await screen.findByRole('button', { name: /ซ่อนแผง/ }));
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });
  });
});
