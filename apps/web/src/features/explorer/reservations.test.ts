import type { UnitView } from '@condoscope/shared';
import { describe, expect, it, vi } from 'vitest';
import { effectiveStatus, loadReservations, RESERVATION_KEY, saveReservations } from './reservations';

const u = { id: 7, status: 'available' } as UnitView;

describe('demo reservations', () => {
  it('round-trips ids through localStorage', () => {
    saveReservations(new Set([1, 2]));
    expect([...loadReservations()]).toEqual([1, 2]);
  });

  it('treats corrupted storage as no reservations', () => {
    localStorage.setItem(RESERVATION_KEY, '{bad json');
    expect(loadReservations().size).toBe(0);
    localStorage.setItem(RESERVATION_KEY, '{"a":1}');
    expect(loadReservations().size).toBe(0);
  });

  it('keeps working when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(loadReservations().size).toBe(0);
    expect(() => saveReservations(new Set([1]))).not.toThrow();
  });

  it('shows "mine" only while the unit is still available', () => {
    expect(effectiveStatus({ ...u, status: 'available' }, new Set([u.id]))).toBe('mine');
    expect(effectiveStatus({ ...u, status: 'sold' }, new Set([u.id]))).toBe('sold');
    expect(effectiveStatus({ ...u, status: 'available' }, new Set())).toBe('available');
  });
});
