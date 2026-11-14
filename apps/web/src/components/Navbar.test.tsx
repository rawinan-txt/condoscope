import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { saveReservations } from '../features/explorer/reservations';
import Layout from './Layout';

const at = (path: string) =>
  render(<MemoryRouter initialEntries={[path]}><Routes><Route element={<Layout />}><Route path="*" element={<p>page</p>} /></Route></Routes></MemoryRouter>);
const reservations = () => screen.queryByRole('link', { name: /รายการที่จองไว้/ });

describe('Navbar', () => {
  it('has the logo, search and map links', () => {
    at('/');
    expect(screen.getByRole('link', { name: 'CondoScope' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'ค้นหาคอนโด' })).toHaveAttribute('href', '/search');
    expect(screen.getByRole('link', { name: 'แผนที่' })).toHaveAttribute('href', '/map');
  });

  it('shows the reservations link only when there are reservations, and keeps the count live', async () => {
    at('/');
    expect(reservations()).toBeNull();
    act(() => saveReservations(new Set([1, 2])));
    expect(await screen.findByRole('link', { name: /รายการที่จองไว้/ })).toHaveTextContent('2');
    act(() => saveReservations(new Set([1])));
    expect(reservations()).toHaveTextContent('1');
    act(() => saveReservations(new Set()));
    expect(reservations()).toBeNull();
  });

  it('reads reservations that already exist when it opens', () => {
    saveReservations(new Set([5, 6, 7]));
    at('/');
    expect(reservations()).toHaveTextContent('3');
  });

  it('marks the current page', () => {
    at('/search');
    expect(screen.getByRole('link', { name: 'ค้นหาคอนโด' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'แผนที่' })).not.toHaveAttribute('aria-current');
  });

  it('the mobile menu button toggles aria-expanded', async () => {
    at('/');
    const button = screen.getByRole('button', { name: 'เมนู' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('every page keeps the mock-data notice in the footer', () => {
    at('/anything');
    expect(screen.getByText(/ข้อมูลจำลองเพื่อการสาธิต ไม่มีการขายจริง/)).toBeInTheDocument();
  });

  it('uses the luxury look: ink bar, serif logo, ink footer', () => {
    at('/');
    expect(screen.getByRole('banner')).toHaveClass('bg-ink');
    expect(screen.getByRole('link', { name: 'CondoScope' })).toHaveClass('font-serif');
    expect(screen.getByRole('contentinfo')).toHaveClass('bg-ink');
  });

  it('keeps the mock-data badge in the bar', () => {
    at('/');
    expect(within(screen.getByRole('banner')).getByText('ข้อมูลจำลอง')).toBeInTheDocument();
  });
});
