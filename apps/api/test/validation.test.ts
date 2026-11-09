import { describe, expect, it } from 'vitest';
import { ApiError } from '../src/errors';
import { buildingUnitsQuery, idParam, parseOrThrow, parseQuery, projectSearchQuery } from '../src/validation';

const status400 = (fn: () => unknown) => {
  try { fn(); } catch (e) { return e instanceof ApiError ? e.status : 'other'; }
  return 'no error';
};

describe('idParam', () => {
  it.each(['abc', '0', '-1', '1.5', '1e3', '0x10', '99999999999999999999', '01', ' 5', '5 ', '', '1;2'])('rejects %j', (v) => {
    expect(status400(() => parseOrThrow(idParam, v))).toBe(400);
  });

  it.each([['1', 1], ['42', 42], ['2147483647', 2147483647], ['9999999999', 9999999999]])('accepts %s', (v, n) => {
    expect(parseOrThrow(idParam, v)).toBe(n);
  });
});

describe('projectSearchQuery', () => {
  const BAD: Record<string, string>[] = [
    { minPrice: '5000000', maxPrice: '1000000' }, { minPrice: '-1' }, { maxPrice: '1e9' }, { minPrice: '1.5' }, { limit: '0' }, { limit: '51' },
    { limit: 'abc' }, { offset: '-1' }, { bedrooms: '3' }, { bedrooms: 'x' }, { sort: 'hax' }, { q: 'x'.repeat(101) }, { province: 'x'.repeat(101) },
  ];
  it.each(BAD)('rejects %j with 400', (q) => {
    expect(status400(() => parseQuery(projectSearchQuery, q))).toBe(400);
  });

  it('converts text to numbers and keeps defaults out', () => {
    expect(parseQuery(projectSearchQuery, { minPrice: '100', bedrooms: '2', limit: '5', sort: 'newest' })).toEqual({ minPrice: 100, bedrooms: 2, limit: 5, sort: 'newest' });
  });

  it('treats empty values as absent and trims q', () => {
    expect(parseQuery(projectSearchQuery, { province: '', limit: '50', q: '  ari  ' })).toEqual({ limit: 50, q: 'ari' });
    expect(parseQuery(projectSearchQuery, { q: ' '.repeat(5) })).toEqual({});
    expect(parseQuery(projectSearchQuery, { q: ` ${'x'.repeat(100)} ` })).toEqual({ q: 'x'.repeat(100) });
  });

  it('ignores unknown parameters', () => {
    expect(parseQuery(projectSearchQuery, { utm_source: 'x' })).toEqual({});
  });

  it('error text names the field and never echoes the input', () => {
    try { parseQuery(projectSearchQuery, { sort: 'SECRET-VALUE' }); } catch (e) {
      expect((e as ApiError).message).toContain('sort');
      expect((e as ApiError).message).not.toContain('SECRET-VALUE');
    }
  });
});

describe('buildingUnitsQuery', () => {
  it.each<Record<string, string>>([{ floor: 'abc' }, { floor: '-1' }, { floor: '1e2' }, { status: 'SOLD' }, { status: 'x' }])('rejects %j', (q) => {
    expect(status400(() => parseQuery(buildingUnitsQuery, q))).toBe(400);
  });

  it('accepts floor and status', () => {
    expect(parseQuery(buildingUnitsQuery, { floor: '18', status: 'available' })).toEqual({ floor: 18, status: 'available' });
    expect(parseQuery(buildingUnitsQuery, {})).toEqual({});
  });
});
