import { Hono } from 'hono';
import { found } from '../errors';
import { getUnitDetail, getUnitFloorPlan, getUnitImages } from '../services/queries';
import { idParam, parseOrThrow } from '../validation';

const unitId = (raw: string) => parseOrThrow(idParam, raw, 'id');

export const units = new Hono<{ Bindings: Env }>()
  .get('/api/units/:id', async (c) => c.json(found(await getUnitDetail(c.env.DB, unitId(c.req.param('id'))), 'Unit')))
  .get('/api/units/:id/images', async (c) => c.json(found(await getUnitImages(c.env.DB, unitId(c.req.param('id'))), 'Unit')))
  .get('/api/units/:id/floor-plan', async (c) => c.json(found(await getUnitFloorPlan(c.env.DB, unitId(c.req.param('id'))), 'Unit')));
