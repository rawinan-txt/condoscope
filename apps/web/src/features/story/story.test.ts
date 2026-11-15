import { buildExplorer, buildProjectDetail, type Dataset } from '@condoscope/shared';
import { describe, expect, it } from 'vitest';
import fallback from '../../data/fallback.json';
import { pickStoryProjects, storyOf, totalsOf } from './story';

const data = fallback as unknown as Dataset;

describe('pickStoryProjects', () => {
  it('puts the featured project first, then the others by id, at most three', () => {
    const r = pickStoryProjects([...data.projects].reverse());
    expect(r).toHaveLength(3);
    expect(r[0].is_featured).toBe(true);
    const others = r.slice(1).map((p) => p.id);
    expect(others).toEqual([...others].sort((a, b) => a - b));
  });
  it('copes with fewer projects, none, and no featured one', () => {
    expect(pickStoryProjects([])).toEqual([]);
    expect(pickStoryProjects(data.projects.slice(0, 2))).toHaveLength(2);
    expect(pickStoryProjects(data.projects.map((p) => ({ ...p, is_featured: false })))[0].id).toBe(Math.min(...data.projects.map((p) => p.id)));
  });
});

describe('totalsOf', () => {
  const details = data.projects.map((p) => buildProjectDetail(data, p.id)!);
  const real = data.units.filter((u) => u.status === 'available').length;
  it('sums the free units of every project', () => {
    expect(totalsOf(data.projects, details)).toEqual({ projects: data.projects.length, available: real });
  });
  it('gives no available number when any project did not answer (no partial sums)', () => {
    expect(totalsOf(data.projects, [...details.slice(1), null]).available).toBeNull();
    expect(totalsOf(data.projects, details.slice(1)).available).toBeNull();
  });
});

describe('storyOf', () => {
  it('finds a free unit, and null when there is none', () => {
    const d = buildExplorer(data, 1)!;
    expect(storyOf(d)!.unit.status).toBe('available');
    expect(storyOf({ ...d, units: d.units.map((u) => ({ ...u, status: 'sold' as const })) })).toBeNull();
  });
});
