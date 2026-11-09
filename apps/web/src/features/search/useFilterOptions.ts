import { useMemo } from 'react';
import { useResource } from '../../hooks/useResource';
import { searchProjects } from '../../services/api';

/** Province and district choices come from the projects themselves. While they load (or if that fails) the lists are empty. */
export function useFilterOptions() {
  const r = useResource(() => searchProjects({ limit: 50 }), []);
  const projects = useMemo(() => (r.state === 'ok' ? r.data.items : []), [r]);
  return useMemo(() => ({
    provinces: [...new Set(projects.map((p) => p.province))],
    districts: (province?: string) => [...new Set(projects.filter((p) => !province || p.province === province).map((p) => p.district))],
  }), [projects]);
}
