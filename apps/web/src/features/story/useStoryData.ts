import type { ExplorerPayload, Project } from '@condoscope/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useReportSource } from '../../components/Layout';
import { getExplorer, getProject } from '../../services/api';
import { pickStoryProjects, storyOf, totalsOf, type Story } from './story';
import type { Tier } from './tier';

export interface Scene { project: Project; data: ExplorerPayload; story: Story }
export interface StoryData { picks: Project[]; totals: { projects: number; available: number | null } | null; scenes: (Scene | null)[] }

const idle = (cb: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(cb, { timeout: 1500 }) : setTimeout(cb, 300));

/**
 * What the story needs from the API, fetched in the background after the first screen is up:
 * - whole-system totals (one cheap aggregate per project), for every tier;
 * - the live 3D scenes: the first tower at once, the other two once the visitor has scrolled a little (`step` in hundredths of the story).
 * A request that fails leaves its slot empty: the story carries on without it (it never shows a partial or invented number).
 */
export function useStoryData(projects: Project[], tier: Tier, step: number): StoryData {
  const report = useReportSource();
  const picks = useMemo(() => pickStoryProjects(projects), [projects]);
  const [totals, setTotals] = useState<StoryData['totals']>(null);
  const [scenes, setScenes] = useState<(Scene | null)[]>([null, null, null]);
  const asked = useRef(new Set<number>());

  useEffect(() => {
    if (!projects.length) return;
    let alive = true;
    const handle = idle(() => {
      Promise.allSettled(projects.map((p) => getProject(p.id))).then((rs) => {
        if (!alive) return;
        for (const r of rs) if (r.status === 'fulfilled' && r.value.source === 'fallback') report('fallback');
        setTotals(totalsOf(projects, rs.map((r) => (r.status === 'fulfilled' ? r.value.data : null))));
      });
    });
    return () => { alive = false; if (typeof handle === 'number') { try { cancelIdleCallback(handle); } catch { /* a timeout id */ } } };
  }, [projects, report]);

  useEffect(() => {
    if (tier !== 'live') return;
    picks.forEach((project, i) => {
      if (i > 0 && step < 15) return; // the other towers are only needed once the visitor starts to scroll
      if (asked.current.has(project.id)) return;
      asked.current.add(project.id);
      getExplorer(project.id).then((r) => {
        if (r.source === 'fallback') report('fallback');
        const story = storyOf(r.data);
        if (story) setScenes((s) => s.map((x, k) => (k === i ? { project, data: r.data, story } : x)));
      }).catch(() => { asked.current.delete(project.id); });
    });
  }, [tier, picks, step >= 15, report]); // eslint-disable-line react-hooks/exhaustive-deps -- step only matters as "scrolled a little yet"

  return { picks, totals, scenes };
}
