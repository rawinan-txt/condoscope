import { Car, Check, Dumbbell, Laptop, PlugZap, ShieldCheck, Trees, WashingMachine, Waves, type LucideIcon } from 'lucide-react';

/** The icon names the dataset uses for amenities (packages/shared/src/projects.ts) → lucide icons. */
export const AMENITY_ICONS: Record<string, LucideIcon> = {
  waves: Waves,
  dumbbell: Dumbbell,
  trees: Trees,
  laptop: Laptop,
  car: Car,
  'shield-check': ShieldCheck,
  'plug-zap': PlugZap,
  'washing-machine': WashingMachine,
};

export default function AmenityIcon({ name, className = 'size-5' }: { name: string; className?: string }) {
  const Icon = AMENITY_ICONS[name] ?? Check;
  return <Icon className={className} aria-hidden />;
}
