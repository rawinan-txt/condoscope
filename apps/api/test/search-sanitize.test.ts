import { sanitizeSearchParams, toQueryRecord } from '@condoscope/shared';
import { describe, expect, it } from 'vitest';
import { parseQuery, projectSearchQuery } from '../src/validation';

/**
 * The search page sends whatever is in the URL through sanitizeSearchParams. Whatever comes out must be accepted by
 * the API's own validation, otherwise a messy URL would turn into a "not found" page.
 */
const KEYS = ['q', 'province', 'district', 'minPrice', 'maxPrice', 'bedrooms', 'sort', 'limit', 'offset'];
const NASTY = [
  '', ' ', 'abc', '-1', '0', '1', '2', '3', '1.5', '1e3', '0x10', '99999999999999999999', '5000000', '51', '999',
  '😀', '🏢'.repeat(100), '%', '%25', '_', "'", '"; DROP TABLE units;--', 'x'.repeat(500), 'ก'.repeat(300), '\u0000', 'null', 'undefined', 'newest', 'price_asc',
];

describe('sanitized search parameters are always accepted by the API validation', () => {
  const inputs: Record<string, string>[] = [
    ...KEYS.flatMap((key) => NASTY.map((value) => ({ [key]: value }))),
    { minPrice: '5000000', maxPrice: '1000000' },
    { minPrice: 'abc', maxPrice: '1', limit: '999', bedrooms: '9', sort: 'x', q: 'x'.repeat(500) },
    Object.fromEntries(KEYS.map((k) => [k, '😀'.repeat(60)])),
  ];

  it(`${inputs.length} messy inputs`, () => {
    expect(inputs.length).toBeGreaterThanOrEqual(40);
    for (const input of inputs) {
      const record = toQueryRecord(sanitizeSearchParams(input));
      expect(() => parseQuery(projectSearchQuery, record), JSON.stringify(input).slice(0, 80)).not.toThrow();
    }
  });
});
