import type { UnitStatus, UnitView } from '@condoscope/shared';

/** Demo reservations: unit ids only, this browser only, never sent anywhere. */
export const RESERVATION_KEY = 'condoscope-demo-reservations';

const listeners = new Set<() => void>();

export function loadReservations(): Set<number> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RESERVATION_KEY) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((x): x is number => Number.isInteger(x)) : []);
  } catch {
    return new Set();
  }
}

export function saveReservations(ids: Set<number>): void {
  try {
    localStorage.setItem(RESERVATION_KEY, JSON.stringify([...ids]));
  } catch {
    /* storage blocked: the reservation lives until the page closes */
  }
  listeners.forEach((l) => l());
}

/** Calls cb after every save in this tab and when another tab changes the reservations. Returns the unsubscribe function. */
export function subscribeReservations(cb: () => void): () => void {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
}

/** A stale reservation (unit no longer available in the data) is ignored. */
export const effectiveStatus = (u: UnitView, mine: Set<number>): UnitStatus | 'mine' =>
  u.status === 'available' && mine.has(u.id) ? 'mine' : u.status;
