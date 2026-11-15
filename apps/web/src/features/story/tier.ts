export type Tier = 'static' | 'stills' | 'live';

export interface TierEnv {
  reducedMotion: boolean; saveData: boolean; effectiveType?: string; hasWebGL: boolean;
  cores?: number; memoryGb?: number; coarsePointer: boolean; width: number;
}

/** How the story is shown: live 3D, pre-rendered stills scrubbed by scroll, or plain content. Unknown values (Safari has no connection info) do not count against the device. */
export function chooseTier(e: TierEnv): Tier {
  if (e.reducedMotion) return 'static';
  if (e.saveData || (e.effectiveType !== undefined && ['slow-2g', '2g', '3g'].includes(e.effectiveType)) || !e.hasWebGL) return 'stills';
  if ((e.cores !== undefined && e.cores <= 4) || (e.memoryGb !== undefined && e.memoryGb <= 4) || (e.coarsePointer && e.width < 768)) return 'stills';
  return 'live';
}
