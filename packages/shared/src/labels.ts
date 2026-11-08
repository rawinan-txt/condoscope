import type { UnitStatus, UnitType } from './types';

export const STATUS_LABEL: Record<UnitStatus, string> = {
  available: 'ว่าง', reserved: 'จองแล้ว', sold: 'ขายแล้ว', unavailable: 'ไม่เปิดขาย',
};

export const UNIT_TYPE_LABEL: Record<UnitType, string> = {
  studio: 'สตูดิโอ', '1br': '1 ห้องนอน', '2br': '2 ห้องนอน', '2br_plus': '2 ห้องนอน พลัส',
};

const thb = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 });
export const formatTHB = (n: number): string => thb.format(n);
export const formatMillion = (n: number): string => `${+(n / 1e6).toFixed(2)} ล้านบาท`;
