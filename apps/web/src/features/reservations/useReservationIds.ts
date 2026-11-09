import { useSyncExternalStore } from 'react';
import { loadReservations, subscribeReservations } from '../explorer/reservations';

/** The reserved unit ids, ascending, kept in step with saves in this tab and in other tabs. */
export function useReservationIds(): number[] {
  // the snapshot is a string so React sees "no change" when the ids are the same
  const snapshot = useSyncExternalStore(subscribeReservations, () => JSON.stringify([...loadReservations()].sort((a, b) => a - b)));
  return JSON.parse(snapshot) as number[];
}
