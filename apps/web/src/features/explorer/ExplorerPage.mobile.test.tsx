import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';

const at = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

// a phone: nothing matches `(min-width: 768px)`
beforeEach(() => {
  try { sessionStorage.clear(); } catch { /* ignore */ }
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }));
});

const sheet = () => screen.findByRole('region', { name: 'แผงห้อง' });

describe('explorer on a phone (bottom sheet)', () => {
  it('starts peeking: a hint and the controls, no big panels, no desktop side column', async () => {
    at('/explorer/1');
    const s = await sheet();
    expect(within(s).getByRole('button', { name: 'ขยายแผง' })).toHaveAttribute('aria-expanded', 'false');
    expect(within(s).getByText(/แตะห้องบนตึก/)).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ซ่อนแผง' })).not.toBeInTheDocument(); // the desktop toggle
  });

  it('expands to the tabs and the room list, and the legend moves into the sheet', async () => {
    at('/explorer/1');
    const s = await sheet();
    await userEvent.click(within(s).getByRole('button', { name: 'ขยายแผง' }));
    expect(within(s).getByRole('button', { name: 'ย่อแผง' })).toHaveAttribute('aria-expanded', 'true');
    expect(within(s).getByRole('tablist')).toBeInTheDocument();
    expect(within(s).getByRole('table')).toBeInTheDocument();
    expect(within(s).getByRole('list', { name: 'สถานะห้อง' })).toBeInTheDocument();
  });

  it('shows a one-line summary of the picked room while peeking, with the way to its page', async () => {
    at('/explorer/1?unit=1');
    const s = await sheet();
    expect(await within(s).findByText(/ห้อง A-701/)).toBeInTheDocument(); // the ?unit= pick lands just after the first render
    expect(within(s).getByRole('link', { name: 'ดูรายละเอียดห้อง' }).getAttribute('href')).toMatch(/\/unit\/1$/);
    expect(within(s).getByRole('button', { name: 'ขยายแผง' })).toHaveAttribute('aria-expanded', 'false'); // a pick does not cover the building
    expect(screen.queryByRole('heading', { name: 'ห้อง A-701' })).not.toBeInTheDocument(); // the big details panel is for the expanded sheet
  });

  it('keeps the full details in the expanded sheet', async () => {
    at('/explorer/1?unit=1');
    const s = await sheet();
    await within(s).findByText(/ห้อง A-701/);
    await userEvent.click(within(s).getByRole('button', { name: 'ขยายแผง' }));
    expect(within(s).getByRole('heading', { name: 'ห้อง A-701' })).toBeInTheDocument();
  });

  it('can be hidden, leaving only a button to bring it back', async () => {
    at('/explorer/1');
    const s = await sheet();
    await userEvent.click(within(s).getByRole('button', { name: 'ซ่อนแผงห้อง' }));
    expect(screen.queryByRole('region', { name: 'แผงห้อง' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'แสดงแผงห้อง' }));
    expect(await sheet()).toBeInTheDocument();
  });

  it('comes back to peeking when a room is picked while hidden (keyboard on the building)', async () => {
    at('/explorer/1');
    await userEvent.click(within(await sheet()).getByRole('button', { name: 'ซ่อนแผงห้อง' }));
    const building = screen.getByLabelText(/เลือกห้องจากตึก/);
    building.focus();
    await userEvent.keyboard('{ArrowRight}');
    const s = await sheet();
    expect(within(s).getByText(/ห้อง /)).toBeInTheDocument();
    expect(within(s).getByRole('button', { name: 'ขยายแผง' })).toHaveAttribute('aria-expanded', 'false');
  });
});
