import { Hono } from 'hono';
import { found } from '../errors';
import { getExplorer, getProjectBuildings, getProjectDetail, searchProjects } from '../services/queries';
import { idParam, parseOrThrow, parseQuery, projectSearchQuery } from '../validation';

export const projects = new Hono<{ Bindings: Env }>()
  .get('/api/projects', async (c) => c.json(await searchProjects(c.env.DB, parseQuery(projectSearchQuery, c.req.query()))))
  .get('/api/projects/:id', async (c) =>
    c.json(found(await getProjectDetail(c.env.DB, parseOrThrow(idParam, c.req.param('id'), 'id')), 'Project')))
  .get('/api/projects/:id/buildings', async (c) =>
    c.json(found(await getProjectBuildings(c.env.DB, parseOrThrow(idParam, c.req.param('id'), 'id')), 'Project')))
  .get('/api/projects/:id/explorer', async (c) =>
    c.json(found(await getExplorer(c.env.DB, parseOrThrow(idParam, c.req.param('id'), 'id')), 'Project')));
