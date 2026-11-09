import { describe, expect, it } from 'vitest';
import { sanitizeSearchParams, toQueryRecord, type ProjectSearchParams } from '../src';

type Input = Record<string, string | undefined>;

describe('sanitizeSearchParams', () => {
  const CASES: [string, Input, ProjectSearchParams][] = [
    ['non-numeric price is dropped', { minPrice: 'abc' }, {}],
    ['prices with spaces are trimmed', { minPrice: ' 2000000 ', maxPrice: '5000000 ' }, { minPrice: 2_000_000, maxPrice: 5_000_000 }],
    ['min > max are swapped', { minPrice: '5000000', maxPrice: '1000000' }, { minPrice: 1_000_000, maxPrice: 5_000_000 }],
    ['negative / decimal / exponent prices are dropped', { minPrice: '-1', maxPrice: '1e9' }, {}],
    ['a 20-digit price is dropped', { maxPrice: '99999999999999999999' }, {}],
    ['limit above the maximum is clamped to 50', { limit: '999' }, { limit: 50 }],
    ['limit 0 is clamped to 1', { limit: '0' }, { limit: 1 }],
    ['non-numeric limit is dropped', { limit: 'abc' }, {}],
    ['bedrooms outside 0..2 is dropped', { bedrooms: '9' }, {}],
    ['bedrooms 0, 1, 2 are kept', { bedrooms: '2' }, { bedrooms: 2 }],
    ['unknown sort is dropped', { sort: 'x' }, {}],
    ['known sort is kept', { sort: 'newest' }, { sort: 'newest' }],
    ['q is trimmed', { q: '  ari  ' }, { q: 'ari' }],
    ['blank q is dropped', { q: '   ' }, {}],
    ['negative offset is dropped', { offset: '-1' }, {}],
    ['offset is kept', { offset: '40' }, { offset: 40 }],
    ['province and district are trimmed', { province: ' นนทบุรี ', district: ' เมืองนนทบุรี' }, { province: 'นนทบุรี', district: 'เมืองนนทบุรี' }],
    ['undefined and empty values are skipped', { q: undefined, province: '', limit: undefined }, {}],
  ];
  it.each(CASES)('%s', (_name, input, expected) => {
    expect(sanitizeSearchParams(input)).toEqual(expected);
  });

  it('cuts q, province and district to 100 characters', () => {
    const r = sanitizeSearchParams({ q: 'x'.repeat(500), province: 'ก'.repeat(300), district: 'y'.repeat(101) });
    expect(r.q).toHaveLength(100);
    expect(r.province).toHaveLength(100);
    expect(r.district).toHaveLength(100);
  });

  it('ignores unknown keys', () => {
    expect(sanitizeSearchParams({ utm_source: 'x', q: 'ari' })).toEqual({ q: 'ari' });
  });
});

describe('toQueryRecord', () => {
  it('has no undefined values and turns numbers into text', () => {
    expect(toQueryRecord({ q: 'ari', maxPrice: 5_000_000, bedrooms: 0, minPrice: undefined })).toEqual({ q: 'ari', maxPrice: '5000000', bedrooms: '0' });
  });

  it('round-trips with sanitizeSearchParams', () => {
    const p: ProjectSearchParams = { q: 'อารีย์', province: 'กรุงเทพมหานคร', minPrice: 1, maxPrice: 9, bedrooms: 1, sort: 'price_asc', limit: 5, offset: 10 };
    expect(sanitizeSearchParams(toQueryRecord(p))).toEqual(p);
  });
});
