import { describe, expect, it } from 'vitest';
import { formatMillion, formatTHB, STATUS_LABEL, UNIT_TYPE_LABEL } from '../src';

describe('labels', () => {
  it('formats baht amounts', () => {
    expect(formatTHB(4250000)).toBe('฿4,250,000');
    expect(formatMillion(4250000)).toBe('4.25 ล้านบาท');
  });
  it('has Thai labels for every status and unit type', () => {
    expect(STATUS_LABEL.sold).toBe('ขายแล้ว');
    expect(Object.keys(UNIT_TYPE_LABEL)).toHaveLength(4);
  });
});
