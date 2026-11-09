import { SEARCH_MAX_LIMIT } from './payloads';
import type { ProjectSearchParams, ProjectSort } from './types';

const SORTS: ProjectSort[] = ['recommended', 'price_asc', 'price_desc', 'newest'];
const WHOLE = /^[0-9]{1,10}$/;

const text = (v: string | undefined): string | undefined => {
  const t = v?.trim().slice(0, 100).trim();
  return t ? t : undefined;
};
const whole = (v: string | undefined): number | undefined => {
  const t = v?.trim();
  return t !== undefined && WHOLE.test(t) ? Number(t) : undefined;
};

/**
 * Turns whatever is in a URL into search parameters the API will accept (apps/api/test/search-sanitize.test.ts checks
 * this against the API's own validation). Bad values are dropped, too-big ones clamped, a reversed price range swapped.
 */
export function sanitizeSearchParams(input: Record<string, string | undefined>): ProjectSearchParams {
  const out: ProjectSearchParams = {};
  const q = text(input.q);
  if (q) out.q = q;
  const province = text(input.province);
  if (province) out.province = province;
  const district = text(input.district);
  if (district) out.district = district;

  let min = whole(input.minPrice);
  let max = whole(input.maxPrice);
  if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min];
  if (min !== undefined) out.minPrice = min;
  if (max !== undefined) out.maxPrice = max;

  const bedrooms = input.bedrooms?.trim();
  if (bedrooms === '0' || bedrooms === '1' || bedrooms === '2') out.bedrooms = Number(bedrooms) as 0 | 1 | 2;
  const sort = input.sort?.trim() as ProjectSort | undefined;
  if (sort && SORTS.includes(sort)) out.sort = sort;
  const limit = whole(input.limit);
  if (limit !== undefined) out.limit = Math.min(Math.max(limit, 1), SEARCH_MAX_LIMIT);
  const offset = whole(input.offset);
  if (offset !== undefined) out.offset = offset;
  return out;
}

/** For URLSearchParams / the API query string: drops undefined, writes numbers as text. */
export function toQueryRecord(p: ProjectSearchParams): Record<string, string> {
  return Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]));
}
