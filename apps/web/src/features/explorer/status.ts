import { STATUS_LABEL, type UnitStatus } from '@condoscope/shared';

export type DisplayStatus = UnitStatus | 'mine';

/** Every status has a text label; colour is never the only signal. */
export const STATUS_STYLE: Record<DisplayStatus, { label: string; color: string }> = {
  available: { label: STATUS_LABEL.available, color: '#16a34a' },
  reserved: { label: STATUS_LABEL.reserved, color: '#d97706' },
  sold: { label: STATUS_LABEL.sold, color: '#e11d48' },
  unavailable: { label: STATUS_LABEL.unavailable, color: '#64748b' },
  mine: { label: 'คุณจอง (Demo)', color: '#2563eb' },
};

export const DISPLAY_ORDER: DisplayStatus[] = ['available', 'reserved', 'sold', 'unavailable', 'mine'];
