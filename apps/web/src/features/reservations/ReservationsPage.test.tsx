import type { Dataset } from '@condoscope/shared';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import App from '../../App';
import fallback from '../../data/fallback.json';
import { loadReservations, saveReservations } from '../explorer/reservations';

const data = fallback as unknown as Dataset;
const available = data.units.find((u) => u.status === 'available')!;
const sold = data.units.find((u) => u.status === 'sold')!;
const at = () => render(<MemoryRouter initialEntries={['/reservations']}><App /></MemoryRouter>);

describe('ReservationsPage', () => {
  it('says so when nothing is reserved and points to the search', async () => {
    at();
    expect(await screen.findByText('ยังไม่มีรายการที่จอง')).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'ค้นหาคอนโด' })).toHaveAttribute('href', '/search');
  });

  it('lists reserved units with their number and a link, and states that it is a demo', async () => {
    saveReservations(new Set([available.id]));
    at();
    const row = await screen.findByRole('listitem');
    expect(within(row).getByText(available.unit_number)).toBeInTheDocument();
    expect(within(row).getByRole('link', { name: /ดูห้อง/ })).toHaveAttribute('href', `/unit/${available.id}`);
    expect(screen.getByText(/การจองนี้เป็นการสาธิต เก็บไว้ในเบราว์เซอร์นี้เท่านั้น/)).toBeInTheDocument();
  });

  it('cancelling removes the row and the saved reservation', async () => {
    saveReservations(new Set([available.id]));
    at();
    await userEvent.click(await screen.findByRole('button', { name: 'ยกเลิกการจอง (Demo)' }));
    expect(await screen.findByText('ยังไม่มีรายการที่จอง')).toBeInTheDocument();
    expect(loadReservations().size).toBe(0);
  });

  it('a reservation whose unit is no longer available, or does not exist, is flagged and can be removed', async () => {
    saveReservations(new Set([sold.id, 999999]));
    at();
    expect(await screen.findAllByText('รายการนี้ใช้ไม่ได้แล้ว')).toHaveLength(2);
    const buttons = screen.getAllByRole('button', { name: 'ลบรายการนี้' });
    await userEvent.click(buttons[0]);
    expect(screen.getAllByText('รายการนี้ใช้ไม่ได้แล้ว')).toHaveLength(1);
    expect(loadReservations().size).toBe(1);
  });
});
