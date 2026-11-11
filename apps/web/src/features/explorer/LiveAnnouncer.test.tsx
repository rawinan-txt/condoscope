import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../../App';

const at = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
const announcer = () => screen.findByRole('status', { name: 'ประกาศการเลือกห้อง' });
const pick = async (unit: string) => userEvent.click((await screen.findAllByRole('button', { name: new RegExp(`^ห้อง ${unit} `) }))[0]);

beforeEach(() => { try { sessionStorage.clear(); } catch { /* ignore */ } });

describe('LiveAnnouncer (screen reader feedback for what happens on the building)', () => {
  it('is a polite live region and says nothing before anything happens', async () => {
    at('/explorer/1');
    const a = await announcer();
    expect(a).toHaveAttribute('aria-live', 'polite');
    expect(a).toHaveTextContent('');
  });

  it('announces the room that was picked: number, floor, status and price', async () => {
    at('/explorer/1');
    await pick('A-1805');
    expect(await announcer()).toHaveTextContent(/^เลือกห้อง A-1805 ชั้น 18 .+ ล้านบาท$/);
  });

  it('announces when the selection is cleared', async () => {
    at('/explorer/1');
    await pick('A-1805');
    await userEvent.click(screen.getByRole('button', { name: 'ปิดรายละเอียดห้อง' }));
    expect(await announcer()).toHaveTextContent('ล้างการเลือกห้อง');
  });

  it('announces how many rooms match when a filter changes', async () => {
    at('/explorer/1');
    await userEvent.click(await screen.findByRole('tab', { name: 'ตัวกรอง' }));
    await userEvent.selectOptions(screen.getByLabelText('ราคาสูงสุด'), 'ไม่เกิน 2 ล้าน');
    expect(await announcer()).toHaveTextContent(/^ตรงเงื่อนไข \d+ ห้อง$/);
  });
});
