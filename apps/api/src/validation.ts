import { SEARCH_MAX_LIMIT, type ProjectSearchParams, type UnitStatus } from '@condoscope/shared';
import { z } from 'zod';
import { ApiError } from './errors';

// Whole-string patterns, so 1e3, 0x10, 1.5, -1, spaces and 20-digit numbers never reach SQL as numbers.
export const idParam = z.string().regex(/^[1-9][0-9]{0,9}$/, 'must be a positive whole number').transform(Number);
const whole = z.string().regex(/^[0-9]{1,10}$/, 'must be a non-negative whole number').transform(Number);

export const projectSearchQuery = z
  .object({
    q: z.string().transform((s) => s.trim()).pipe(z.string().max(100)).optional(),
    province: z.string().max(100).optional(),
    district: z.string().max(100).optional(),
    minPrice: whole.optional(),
    maxPrice: whole.optional(),
    bedrooms: z.enum(['0', '1', '2']).transform((v) => Number(v) as 0 | 1 | 2).optional(),
    sort: z.enum(['recommended', 'price_asc', 'price_desc', 'newest']).optional(),
    limit: whole.pipe(z.number().min(1).max(SEARCH_MAX_LIMIT)).optional(),
    offset: whole.optional(),
  })
  .refine((v) => v.minPrice === undefined || v.maxPrice === undefined || v.minPrice <= v.maxPrice, {
    message: 'minPrice must not be greater than maxPrice',
    path: ['minPrice'],
  })
  .transform((v): ProjectSearchParams => {
    const { q, ...rest } = v;
    return q ? { ...rest, q } : rest; // a blank q means "no search text"
  });

export const buildingUnitsQuery = z.object({
  floor: z.string().regex(/^[0-9]{1,3}$/, 'must be a non-negative whole number').transform(Number).optional(),
  status: z.enum(['available', 'reserved', 'sold', 'unavailable']).optional() as z.ZodOptional<z.ZodType<UnitStatus>>,
});

/** 400 VALIDATION_ERROR naming the first bad field. The message never repeats what the caller sent. */
export function parseOrThrow<S extends z.ZodType>(schema: S, input: unknown, label = 'request'): z.output<S> {
  const r = schema.safeParse(input);
  if (r.success) return r.data;
  const issue = r.error.issues[0];
  throw new ApiError(400, 'VALIDATION_ERROR', `${issue.path.join('.') || label}: ${issue.message}`);
}

/** Query strings: an empty value (?province=) counts as not given. Repeated keys: Hono hands over the first. */
export function parseQuery<S extends z.ZodType>(schema: S, query: Record<string, string>): z.output<S> {
  return parseOrThrow(schema, Object.fromEntries(Object.entries(query).filter(([, v]) => v !== '')));
}
