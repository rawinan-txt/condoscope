import { Hono } from 'hono';
import { found } from '../errors';
import { getBuildingFloors, getBuildingUnits } from '../services/queries';
import { buildingUnitsQuery, idParam, parseOrThrow, parseQuery } from '../validation';

export const buildings = new Hono<{ Bindings: Env }>()
  .get('/api/buildings/:id/floors', async (c) =>
    c.json(found(await getBuildingFloors(c.env.DB, parseOrThrow(idParam, c.req.param('id'), 'id')), 'Building')))
  .get('/api/buildings/:id/units', async (c) => {
    const id = parseOrThrow(idParam, c.req.param('id'), 'id');
    return c.json(found(await getBuildingUnits(c.env.DB, id, parseQuery(buildingUnitsQuery, c.req.query())), 'Building'));
  });
